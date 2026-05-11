"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showErrorCard, setShowErrorCard] = useState(false);
    const [shaking, setShaking] = useState(false);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setShowErrorCard(false);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

        if (!email || !password) {
            setError("Please enter both email and password.");
            triggerShake();
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin-portal/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.error === "Invalid email or password" 
                    ? "Authentication Failed: The credentials provided do not match our records. Please verify your details. 🔒"
                    : (data.error || "Login failed");
                
                setError(errorMsg);
                setShowErrorCard(true);
                triggerShake();

                // Auto-hide error after 7 seconds
                errorTimeoutRef.current = setTimeout(() => {
                    setShowErrorCard(false);
                }, 7000);
                return;
            }

            // Success — store pending data for OTP page
            sessionStorage.setItem("apt", data.pendingToken);
            sessionStorage.setItem("ame", data.maskedEmail);
            sessionStorage.setItem("aexp", String(Date.now() + data.expiresIn * 1000));
            router.push("/admin-portal/verify");
        } catch {
            setError("Network Error: Unable to establish a secure connection. Please try again. 🌐");
            setShowErrorCard(true);
            triggerShake();
            errorTimeoutRef.current = setTimeout(() => setShowErrorCard(false), 7000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
        >
            <div
                ref={cardRef}
                style={{
                    width: "100%",
                    maxWidth: 400,
                    background: "rgba(26, 29, 36, 0.85)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "40px",
                    animation: shaking
                        ? "adminShake 0.4s ease-in-out"
                        : "adminFadeInUp 0.4s ease-out both",
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "rgba(0,212,170,0.12)",
                            marginBottom: 16,
                        }}
                    >
                        <span
                            style={{
                                color: "#00D4AA",
                                fontWeight: 700,
                                fontSize: 20,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            ST
                        </span>
                    </div>
                    <h1
                        style={{
                            margin: 0,
                            color: "#F0F2F5",
                            fontSize: 22,
                            fontWeight: 500,
                        }}
                    >
                        Admin Portal
                    </h1>
                    <p
                        style={{
                            margin: "6px 0 0",
                            color: "#4B5168",
                            fontSize: 13,
                        }}
                    >
                        Authorized personnel only
                    </p>
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: 1,
                        background: "rgba(255,255,255,0.06)",
                        margin: "0 0 28px",
                    }}
                />

                <form onSubmit={handleSubmit}>
                    {/* Email input */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ position: "relative" }}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#4B5168"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    position: "absolute",
                                    left: 14,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            >
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                autoComplete="email"
                                autoFocus
                                style={{
                                    width: "100%",
                                    height: 48,
                                    background: "#1A1D24",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 10,
                                    color: "#F0F2F5",
                                    fontSize: 14,
                                    paddingLeft: 42,
                                    paddingRight: 14,
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "rgba(0,212,170,0.4)")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                                }
                            />
                        </div>
                    </div>

                    {/* Password input */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ position: "relative" }}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#4B5168"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    position: "absolute",
                                    left: 14,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            >
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete="current-password"
                                style={{
                                    width: "100%",
                                    height: 48,
                                    background: "#1A1D24",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 10,
                                    color: "#F0F2F5",
                                    fontSize: 14,
                                    paddingLeft: 42,
                                    paddingRight: 48,
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "rgba(0,212,170,0.4)")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 4,
                                    color: "#4B5168",
                                    display: "flex",
                                }}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            height: 48,
                            background: loading ? "#00B896" : "#00D4AA",
                            color: "#0A0B0D",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? "wait" : "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            opacity: loading ? 0.8 : 1,
                        }}
                        onMouseOver={(e) => {
                            if (!loading) {
                                e.currentTarget.style.background = "#00EBBF";
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 20px rgba(0,212,170,0.3)";
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = loading
                                ? "#00B896"
                                : "#00D4AA";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        {loading ? (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                style={{ animation: "spin 1s linear infinite" }}
                            >
                                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="#0A0B0D"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray="31"
                                    strokeLinecap="round"
                                />
                            </svg>
                        ) : (
                            "Send Verification Code"
                        )}
                    </button>
                </form>

                {/* Error message */}
                {/* Error message card */}
                <div style={{ position: "relative" }}>
                    <AnimatePresence>
                        {showErrorCard && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    left: 0,
                                    right: 0,
                                    zIndex: 10,
                                    padding: "16px",
                                    background: "rgba(239,68,68,0.1)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: 14,
                                    boxShadow: "0 8px 32px rgba(239,68,68,0.15)",
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start"
                                }}
                            >
                                <div style={{ 
                                    width: 32, height: 32, borderRadius: "50%", 
                                    background: "rgba(239,68,68,0.2)", 
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <span style={{ fontSize: 16 }}>⚠️</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: "0 0 4px", color: "#FCA5A5", fontSize: 14, fontWeight: 600 }}>Access Denied</h4>
                                    <p style={{ margin: 0, color: "rgba(252,165,165,0.8)", fontSize: 13, lineHeight: 1.4 }}>
                                        {error}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowErrorCard(false)}
                                    style={{ 
                                        background: "none", border: "none", color: "rgba(252,165,165,0.4)", 
                                        cursor: "pointer", padding: 4, fontSize: 18 
                                    }}
                                >
                                    ×
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom note */}
                <p
                    style={{
                        margin: "24px 0 0",
                        color: "#3A3E50",
                        fontSize: 11,
                        textAlign: "center",
                        lineHeight: 1.5,
                    }}
                >
                    🔒 All access attempts are logged and monitored
                </p>
            </div>
        </div>
    );
}
