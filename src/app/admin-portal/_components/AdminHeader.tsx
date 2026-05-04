"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivacy } from "./PrivacyMode";
import { Eye, EyeOff } from "lucide-react";

export function AdminHeader() {
    const router = useRouter();
    const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
    const [adminName, setAdminName] = useState("");
    const [adminRole, setAdminRole] = useState("");

    useEffect(() => {
        // Fetch current admin info
        fetch("/api/admin-portal/auth/me")
            .then(res => {
                if (res.status === 401) {
                    router.push("/");
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.admin) {
                    setAdminName(data.admin.displayName);
                    setAdminRole(data.admin.role);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <header
            style={{
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(10, 11, 13, 0.4)",
                backdropFilter: "blur(12px)",
                position: "sticky",
                top: 0,
                zIndex: 40,
            }}
        >
            <div>
                {/* Could put breadcrumbs here */}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {/* Privacy Toggle */}
                <button
                    onClick={togglePrivacyMode}
                    title="Toggle Privacy Mode (Ctrl+Shift+P)"
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: isPrivacyMode ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                        color: isPrivacyMode ? "#F87171" : "#8B8FA8",
                        border: isPrivacyMode ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.1)",
                        padding: "8px 16px", borderRadius: 20,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    Privacy: {isPrivacyMode ? "ON" : "OFF"}
                </button>

                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

                {/* Admin Profile */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#F0F2F5", fontSize: 14, fontWeight: 500 }}>
                            {adminName || "Admin"}
                        </p>
                        <p style={{ margin: 0, color: "#00D4AA", fontSize: 11, textTransform: "uppercase" }}>
                            {adminRole.replace("_", " ")}
                        </p>
                    </div>
                    <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "linear-gradient(135deg, #00D4AA, #3B82F6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#0A0B0D", fontWeight: 700, fontSize: 16
                    }}>
                        {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                    </div>
                </div>
            </div>
        </header>
    );
}
