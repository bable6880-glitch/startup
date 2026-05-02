"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface EntityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: number;
}

export function EntityDrawer({ isOpen, onClose, title, children, width = 450 }: EntityDrawerProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isMounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(10, 11, 13, 0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 100,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width,
                    background: "#12141A",
                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
                    zIndex: 101,
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0, color: "#F0F2F5", fontSize: 18, fontWeight: 600 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent", border: "none", color: "#8B8FA8", cursor: "pointer",
                            padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.color = "#F0F2F5";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#8B8FA8";
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
                    {children}
                </div>
            </div>
        </>
    );
}
