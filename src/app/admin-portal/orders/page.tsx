"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../_components/DataTable";
import { usePrivacy, SensitiveValue } from "../_components/PrivacyMode";
import { Package, Utensils, User, CreditCard } from "lucide-react";

export default function AdminOrdersPage() {
    const { isPrivacyMode } = usePrivacy();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const fetchOrders = async (currentPage: number, currentSearch: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-portal/orders?page=${currentPage}&limit=${limit}&search=${currentSearch}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                setTotal(json.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(page, search);
    }, [page, search]);

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "#10B981";
            case "PENDING": return "#F59E0B";
            case "ACCEPTED": return "#3B82F6";
            case "CANCELLED": return "#EF4444";
            default: return "#8B8FA8";
        }
    };

    const columns: Column<any>[] = [
        {
            header: "Order ID",
            cell: (order) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={16} color="#8B8FA8" />
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#F0F2F5" }}>
                        {order.id.split("-")[0].toUpperCase()}
                    </span>
                </div>
            ),
        },
        {
            header: "Kitchen & Customer",
            cell: (order) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#F0F2F5", fontWeight: 500 }}>
                        <Utensils size={12} color="#3B82F6" /> {order.kitchenName || "Unknown"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8B8FA8" }}>
                        <User size={12} /> {order.customerName || "Guest"}
                    </div>
                </div>
            ),
        },
        {
            header: "Status",
            cell: (order) => {
                const color = getStatusColor(order.status);
                return (
                    <span style={{
                        padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: `${color}1A`, color: color
                    }}>
                        {order.status}
                    </span>
                );
            },
        },
        {
            header: "Amount",
            cell: (order) => (
                <span style={{ fontWeight: 600, color: "#F0F2F5" }}>
                    {isPrivacyMode ? <SensitiveValue>HIDDEN</SensitiveValue> : `Rs. ${(order.totalAmount / 100).toLocaleString()}`}
                </span>
            ),
        },
        {
            header: "Payment",
            cell: (order) => (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <CreditCard size={14} color="#8B8FA8" />
                    <span style={{ color: order.paymentStatus === "PAID" ? "#10B981" : "#8B8FA8" }}>
                        {order.paymentMethod}
                    </span>
                </div>
            ),
        },
        {
            header: "Date",
            cell: (order) => (
                <span style={{ color: "#8B8FA8", fontSize: 13 }}>
                    {new Date(order.createdAt).toLocaleString()}
                </span>
            ),
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Global Orders</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>View and track all platform orders in real-time.</p>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onSearch={handleSearch}
                searchPlaceholder="Search by ID, Kitchen, or Customer..."
                isLoading={loading}
                pagination={{
                    page,
                    pageSize: limit,
                    total,
                    onPageChange: setPage
                }}
            />
        </div>
    );
}
