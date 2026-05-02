"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../_components/DataTable";
import { usePrivacy, SensitiveValue } from "../_components/PrivacyMode";
import { Wallet, TrendingUp, Download, Receipt } from "lucide-react";

export default function AdminCommissionPage() {
    const { isPrivacyMode } = usePrivacy();
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalVolume: 0, totalCommission: 0 });
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 15;

    const fetchLedger = async (currentPage: number, currentSearch: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-portal/commission?page=${currentPage}&limit=${limit}&search=${currentSearch}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                setSummary(json.summary);
                setTotal(json.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch commission ledger", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger(page, search);
    }, [page, search]);

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1);
    };

    const columns: Column<any>[] = [
        {
            header: "Date",
            cell: (row) => (
                <span style={{ color: "#8B8FA8", fontSize: 13 }}>
                    {new Date(row.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: "Order / Kitchen",
            cell: (row) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#F0F2F5", fontFamily: "monospace" }}>
                        <Receipt size={12} color="#8B8FA8" /> {(row.orderId || "").split("-")[0].toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: "#3B82F6", fontWeight: 500 }}>
                        {row.kitchenName || "Unknown Kitchen"}
                    </div>
                </div>
            ),
        },
        {
            header: "Rate",
            cell: (row) => (
                <span style={{ 
                    padding: "2px 6px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: "rgba(167, 139, 250, 0.1)", color: "#A78BFA"
                }}>
                    {(Number(row.commissionRate) * 100).toFixed(1)}%
                </span>
            ),
        },
        {
            header: "Order Value",
            cell: (row) => (
                <span style={{ color: "#8B8FA8", fontSize: 13 }}>
                    {isPrivacyMode ? <SensitiveValue>HIDDEN</SensitiveValue> : `Rs. ${Number(row.orderAmountRs).toLocaleString()}`}
                </span>
            ),
        },
        {
            header: "Commission",
            cell: (row) => (
                <span style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>
                    {isPrivacyMode ? <SensitiveValue>HIDDEN</SensitiveValue> : `+ Rs. ${Number(row.commissionAmountRs).toLocaleString()}`}
                </span>
            ),
        },
        {
            header: "Net (Cook)",
            cell: (row) => (
                <span style={{ color: "#F0F2F5", fontSize: 14, fontWeight: 500 }}>
                    {isPrivacyMode ? <SensitiveValue>HIDDEN</SensitiveValue> : `Rs. ${Number(row.netAmountRs).toLocaleString()}`}
                </span>
            ),
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Commission Ledger</h1>
                    <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Track platform revenue splits and deductions per order.</p>
                </div>
                <button
                    onClick={() => alert("CSV Export would download here in production.")}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(0, 212, 170, 0.1)", border: "1px solid rgba(0, 212, 170, 0.2)",
                        color: "#00D4AA", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(0, 212, 170, 0.2)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(0, 212, 170, 0.1)"}
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1, background: "rgba(26, 29, 36, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 8, borderRadius: 8, background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
                            <Wallet size={20} />
                        </div>
                        <span style={{ color: "#8B8FA8", fontSize: 14, fontWeight: 500 }}>Lifetime Processed Volume</span>
                    </div>
                    <div style={{ color: "#F0F2F5", fontSize: 32, fontWeight: 600, fontFamily: "monospace" }}>
                        {isPrivacyMode ? <SensitiveValue>Rs. *,***,***</SensitiveValue> : `Rs. ${summary.totalVolume.toLocaleString()}`}
                    </div>
                </div>

                <div style={{ flex: 1, background: "rgba(26, 29, 36, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 8, borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
                            <TrendingUp size={20} />
                        </div>
                        <span style={{ color: "#8B8FA8", fontSize: 14, fontWeight: 500 }}>Lifetime Earned Commission</span>
                    </div>
                    <div style={{ color: "#10B981", fontSize: 32, fontWeight: 600, fontFamily: "monospace" }}>
                        {isPrivacyMode ? <SensitiveValue>Rs. *,***,***</SensitiveValue> : `Rs. ${summary.totalCommission.toLocaleString()}`}
                    </div>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onSearch={handleSearch}
                searchPlaceholder="Search by Kitchen Name or Order ID..."
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
