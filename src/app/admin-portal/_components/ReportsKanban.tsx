"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, Clock, XCircle, ChevronRight } from "lucide-react";
import { EntityDrawer } from "./EntityDrawer";
import { usePrivacy, SensitiveValue } from "./PrivacyMode";

export function ReportsKanban({ reports, onUpdateReport }: { reports: any[], onUpdateReport: (id: string, status: string, resolution?: string) => void }) {
    const { isPrivacyMode } = usePrivacy();
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [resolutionText, setResolutionText] = useState("");

    const columns = [
        { id: "PENDING", title: "Pending Triage", icon: <Clock size={16} color="#F59E0B" /> },
        { id: "REVIEWED", title: "In Review", icon: <AlertOctagon size={16} color="#3B82F6" /> },
        { id: "RESOLVED", title: "Resolved", icon: <CheckCircle2 size={16} color="#10B981" /> },
        { id: "DISMISSED", title: "Dismissed", icon: <XCircle size={16} color="#8B8FA8" /> },
    ];

    const getTargetColor = (type: string) => {
        switch(type) {
            case "USER": return "#3B82F6";
            case "KITCHEN": return "#F59E0B";
            case "REVIEW": return "#A78BFA";
            default: return "#8B8FA8";
        }
    };

    const handleReportClick = (report: any) => {
        setSelectedReport(report);
        setResolutionText(report.resolution || "");
        setIsDrawerOpen(true);
    };

    const handleUpdateStatus = (status: string) => {
        if (!selectedReport) return;
        onUpdateReport(selectedReport.id, status, resolutionText);
        setIsDrawerOpen(false);
    };

    return (
        <div style={{ display: "flex", gap: 24, overflowX: "auto", paddingBottom: 24, minHeight: 600 }}>
            {columns.map((col) => {
                const colReports = reports.filter(r => r.status === col.id);
                return (
                    <div key={col.id} style={{ 
                        flex: "1 0 300px", maxWidth: 350, 
                        background: "rgba(26, 29, 36, 0.4)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", flexDirection: "column"
                    }}>
                        {/* Column Header */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#F0F2F5", fontSize: 14, fontWeight: 600 }}>
                                {col.icon} {col.title}
                            </div>
                            <span style={{ background: "rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                                {colReports.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
                            {colReports.length === 0 ? (
                                <div style={{ color: "#4B5168", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No reports</div>
                            ) : (
                                colReports.map(report => (
                                    <div 
                                        key={report.id}
                                        onClick={() => handleReportClick(report)}
                                        style={{
                                            background: "rgba(10, 11, 13, 0.6)", borderRadius: 12, padding: 16,
                                            border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                                            transition: "transform 0.2s, border-color 0.2s"
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                            <span style={{ 
                                                fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, 
                                                background: `${getTargetColor(report.targetType)}22`, color: getTargetColor(report.targetType)
                                            }}>
                                                {report.targetType}
                                            </span>
                                            <span style={{ fontSize: 11, color: "#8B8FA8" }}>
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#F0F2F5", fontWeight: 500, lineHeight: 1.4 }}>
                                            {report.reason}
                                        </h4>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8B8FA8" }}>
                                            <AlertOctagon size={12} />
                                            Reported by {isPrivacyMode ? <SensitiveValue>User</SensitiveValue> : (report.reporterName || "Unknown")}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}

            <EntityDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Report Details">
                {selectedReport && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 13 }}>Target Type</span>
                                <span style={{ color: getTargetColor(selectedReport.targetType), fontSize: 13, fontWeight: 600 }}>{selectedReport.targetType}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 13 }}>Target ID</span>
                                <span style={{ color: "#F0F2F5", fontSize: 13, fontFamily: "monospace" }}>{selectedReport.targetId}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#8B8FA8", fontSize: 13 }}>Reporter</span>
                                <span style={{ color: "#F0F2F5", fontSize: 13 }}>{isPrivacyMode ? <SensitiveValue>hidden@email.com</SensitiveValue> : selectedReport.reporterEmail}</span>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ color: "#F0F2F5", fontSize: 15, marginBottom: 8 }}>Reason</h4>
                            <p style={{ color: "#8B8FA8", fontSize: 14, lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 8 }}>
                                {selectedReport.reason}
                            </p>
                        </div>
                        
                        {selectedReport.details && (
                            <div>
                                <h4 style={{ color: "#F0F2F5", fontSize: 15, marginBottom: 8 }}>Additional Details</h4>
                                <p style={{ color: "#8B8FA8", fontSize: 14, lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 8 }}>
                                    {selectedReport.details}
                                </p>
                            </div>
                        )}

                        <div>
                            <h4 style={{ color: "#F0F2F5", fontSize: 15, marginBottom: 8 }}>Resolution Notes</h4>
                            <textarea 
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                placeholder="Add notes about how this was handled..."
                                style={{
                                    width: "100%", minHeight: 100, padding: 16, borderRadius: 8,
                                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                    color: "#F0F2F5", fontSize: 14, resize: "vertical", outline: "none"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                            {selectedReport.status !== "RESOLVED" && (
                                <button
                                    onClick={() => handleUpdateStatus("RESOLVED")}
                                    style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.2)", padding: 12, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                                >
                                    Mark as Resolved
                                </button>
                            )}
                            {selectedReport.status !== "REVIEWED" && selectedReport.status !== "RESOLVED" && (
                                <button
                                    onClick={() => handleUpdateStatus("REVIEWED")}
                                    style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 12, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                                >
                                    Move to In Review
                                </button>
                            )}
                            {selectedReport.status !== "DISMISSED" && (
                                <button
                                    onClick={() => handleUpdateStatus("DISMISSED")}
                                    style={{ background: "rgba(255, 255, 255, 0.05)", color: "#8B8FA8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: 12, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                                >
                                    Dismiss Report
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </EntityDrawer>
        </div>
    );
}
