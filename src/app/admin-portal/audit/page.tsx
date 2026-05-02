"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../_components/DataTable";
import { usePrivacy, SensitiveValue } from "../_components/PrivacyMode";
import { Activity, ShieldAlert } from "lucide-react";

export default function AdminAuditPage() {
    const { isPrivacyMode } = usePrivacy();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 20;

    const fetchAuditLogs = async (currentPage: number, currentSearch: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-portal/audit?page=${currentPage}&limit=${limit}&search=${currentSearch}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                setTotal(json.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs(page, search);
    }, [page, search]);

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1);
    };

    const columns: Column<any>[] = [
        {
            header: "Timestamp",
            cell: (log) => (
                <span style={{ color: "#8B8FA8", fontSize: 13, fontFamily: "monospace" }}>
                    {new Date(log.createdAt).toLocaleString()}
                </span>
            ),
        },
        {
            header: "Admin",
            cell: (log) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 13, color: "#F0F2F5", fontWeight: 500 }}>
                        {isPrivacyMode ? <SensitiveValue>hidden@admin.com</SensitiveValue> : log.adminEmail}
                    </div>
                    <div style={{ fontSize: 11, color: "#8B8FA8" }}>
                        IP: {isPrivacyMode ? <SensitiveValue>192.168.***.***</SensitiveValue> : log.ipAddress}
                    </div>
                </div>
            ),
        },
        {
            header: "Action",
            cell: (log) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {log.action.toLowerCase().includes("ban") || log.action.toLowerCase().includes("suspend") ? (
                        <ShieldAlert size={16} color="#EF4444" />
                    ) : (
                        <Activity size={16} color="#3B82F6" />
                    )}
                    <span style={{ color: "#F0F2F5", fontSize: 13 }}>{log.action}</span>
                </div>
            ),
        },
        {
            header: "Target",
            cell: (log) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ 
                        display: "inline-block", padding: "2px 6px", borderRadius: 4, 
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: "rgba(255,255,255,0.05)", color: "#8B8FA8", width: "fit-content"
                    }}>
                        {log.targetType || "SYSTEM"}
                    </span>
                    <span style={{ color: "#4B5168", fontSize: 11, fontFamily: "monospace" }}>
                        {log.targetId || "N/A"}
                    </span>
                </div>
            ),
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Security Audit Log</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Immutable record of all administrative actions and mutations.</p>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onSearch={handleSearch}
                searchPlaceholder="Search by action, target ID, or admin email..."
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
