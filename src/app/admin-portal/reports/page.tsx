"use client";

import React, { useEffect, useState } from "react";
import { ReportsKanban } from "../_components/ReportsKanban";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin-portal/reports");
            if (res.ok) {
                const json = await res.json();
                setReports(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateReport = async (id: string, status: string, resolution?: string) => {
        try {
            const res = await fetch(`/api/admin-portal/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, resolution })
            });

            if (res.ok) {
                // Update local state without full refetch
                setReports(reports.map(r => r.id === id ? { ...r, status, resolution } : r));
            } else {
                alert("Failed to update report");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, height: "100%" }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Triage & Reports</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Manage user reports for abusive content or kitchen issues.</p>
            </div>

            {loading ? (
                <div style={{ color: "#8B8FA8" }}>Loading reports...</div>
            ) : (
                <div style={{ flex: 1 }}>
                    <ReportsKanban reports={reports} onUpdateReport={handleUpdateReport} />
                </div>
            )}
        </div>
    );
}
