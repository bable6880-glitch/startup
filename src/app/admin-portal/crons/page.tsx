"use client";

import React, { useEffect, useState } from "react";
import { Play, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminCronsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState<string | null>(null);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/admin-portal/crons");
            if (res.ok) {
                const json = await res.json();
                setJobs(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch crons", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleTrigger = async (jobId: string) => {
        if (!confirm(`Are you sure you want to manually run the ${jobId} job now?`)) return;
        
        setTriggering(jobId);
        try {
            const res = await fetch("/api/admin-portal/crons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId })
            });

            if (res.ok) {
                alert(`Job ${jobId} triggered successfully! Check server logs for details.`);
                // Update local status just for visual feedback
                setJobs(jobs.map(j => j.id === jobId ? { ...j, status: "SUCCESS", lastRunAt: new Date().toISOString() } : j));
            } else {
                alert("Failed to trigger job");
            }
        } catch (error) {
            console.error(error);
            alert("Error triggering job");
        } finally {
            setTriggering(null);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, height: "100%" }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Background Jobs (Crons)</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Monitor and manually trigger scheduled maintenance tasks.</p>
            </div>

            {loading ? (
                <div style={{ color: "#8B8FA8" }}>Loading jobs...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {jobs.map(job => (
                        <div 
                            key={job.id}
                            style={{ 
                                background: "rgba(26, 29, 36, 0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
                                padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between"
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                    <h3 style={{ margin: 0, color: "#F0F2F5", fontSize: 18, fontWeight: 600 }}>
                                        {job.name}
                                    </h3>
                                    <span style={{ 
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        background: job.status === "SUCCESS" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        color: job.status === "SUCCESS" ? "#10B981" : "#EF4444"
                                    }}>
                                        {job.status === "SUCCESS" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                        {job.status}
                                    </span>
                                </div>
                                <p style={{ margin: "0 0 16px", color: "#8B8FA8", fontSize: 14 }}>
                                    {job.description}
                                </p>
                                <div style={{ display: "flex", gap: 32 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#4B5168", fontSize: 13, fontFamily: "monospace" }}>
                                        <Clock size={16} /> Schedule: {job.schedule}
                                    </div>
                                    <div style={{ color: "#8B8FA8", fontSize: 13 }}>
                                        <span style={{ color: "#4B5168" }}>Last Run:</span> {new Date(job.lastRunAt).toLocaleString()}
                                    </div>
                                    <div style={{ color: "#8B8FA8", fontSize: 13 }}>
                                        <span style={{ color: "#4B5168" }}>Next Run:</span> {new Date(job.nextRunAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleTrigger(job.id)}
                                disabled={triggering === job.id}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)",
                                    cursor: triggering === job.id ? "not-allowed" : "pointer", transition: "all 0.2s",
                                    opacity: triggering === job.id ? 0.7 : 1
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                                onMouseOut={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)"}
                            >
                                <Play size={18} fill={triggering === job.id ? "transparent" : "currentColor"} />
                                {triggering === job.id ? "Triggering..." : "Run Now"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
