"use client";

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    KeyboardEvent,
    ClipboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { setAdminCsrfToken } from "@/app/admin-portal/_lib/admin-fetch";

const OTP_LENGTH = 6;

export default function AdminVerifyPage() {
    const router = useRouter();
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showErrorCard, setShowErrorCard] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [shaking, setShaking] = useState(false);
    const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
    const [expired, setExpired] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState("");
    const [pendingToken, setPendingToken] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(600);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const submittingRef = useRef(false);

    // Load session data
    useEffect(() => {
        const apt = sessionStorage.getItem("apt");
        const ame = sessionStorage.getItem("ame");
        const aexp = sessionStorage.getItem("aexp");

        if (!apt || !ame) {
            router.push("/admin-portal/login");
            return;
        }

        setPendingToken(apt);
        setMaskedEmail(ame);

        // Calculate remaining seconds from stored expiry
        if (aexp) {
            const remaining = Math.max(0, Math.floor((parseInt(aexp) - Date.now()) / 1000));
            setSecondsLeft(remaining);
            if (remaining === 0) setExpired(true);
        }
    }, [router]);

    // Countdown timer
    useEffect(() => {
        if (secondsLeft <= 0 || expired) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    setExpired(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft, expired]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const getTimerColor = () => {
        if (secondsLeft < 30) return "#EF4444";
        if (secondsLeft < 120) return "#F59E0B";
        return "#F0F2F5";
    };

    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
    };

    // Submit OTP
    const submitOTP = useCallback(
        async (code: string) => {
            if (submittingRef.current || loading) return;
            submittingRef.current = true;
            setLoading(true);
            setError("");
            setShowErrorCard(false);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

            try {
                const res = await fetch("/api/admin-portal/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pendingToken, code }),
                });

                const data = await res.json();

                if (!res.ok) {
                    if (data.maxAttemptsReached) {
                        setMaxAttemptsReached(true);
                        return;
                    }

                    const errorMsg = data.error === "Invalid verification code"
                        ? "Verification Failed: The code entered is incorrect. Please double-check your email. ✉️"
                        : (data.error || "Verification failed");

                    setError(errorMsg);
                    setShowErrorCard(true);
                    if (data.attemptsLeft !== undefined) {
                        setAttemptsLeft(data.attemptsLeft);
                    }
                    triggerShake();

                    // Auto-hide error after 7 seconds
                    errorTimeoutRef.current = setTimeout(() => {
                        setShowErrorCard(false);
                    }, 7000);

                    // Clear inputs and focus first
                    setDigits(Array(OTP_LENGTH).fill(""));
                    setTimeout(() => inputRefs.current[0]?.focus(), 100);
                    return;
                }

                // Success — store CSRF token and clear session storage
                if (data.csrfToken) {
                    setAdminCsrfToken(data.csrfToken);
                }
                sessionStorage.removeItem("apt");
                sessionStorage.removeItem("ame");
                sessionStorage.removeItem("aexp");
                router.push("/admin-portal/dashboard");
            } catch {
                setError("Network error. Please try again.");
                triggerShake();
            } finally {
                setLoading(false);
                submittingRef.current = false;
            }
        },
        [pendingToken, loading, router]
    );

    // Handle input change
    const handleChange = (index: number, value: string) => {
        if (expired || maxAttemptsReached) return;

        // Take only last char, uppercase
        const char = value.slice(-1).toUpperCase();
        if (char && !/[A-Z0-9]/.test(char)) return;

        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        if (char && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when last character is entered
        if (char && index === OTP_LENGTH - 1) {
            const code = newDigits.join("");
            if (code.length === OTP_LENGTH) {
                setTimeout(() => submitOTP(code), 50);
            }
        }
    };

    // Handle keyboard
    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (digits[index]) {
                const newDigits = [...digits];
                newDigits[index] = "";
                setDigits(newDigits);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newDigits = [...digits];
                newDigits[index - 1] = "";
                setDigits(newDigits);
            }
            e.preventDefault();
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, OTP_LENGTH);

        if (pasted.length === 0) return;

        const newDigits = [...digits];
        for (let i = 0; i < OTP_LENGTH; i++) {
            newDigits[i] = pasted[i] || "";
        }
        setDigits(newDigits);

        // Focus last filled or the one after
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();

        // Auto-submit if full
        if (pasted.length === OTP_LENGTH) {
            setTimeout(() => submitOTP(pasted), 50);
        }
    };

    const handleManualSubmit = () => {
        const code = digits.join("");
        if (code.length === OTP_LENGTH) {
            submitOTP(code);
        }
    };

    const returnToLogin = () => {
        sessionStorage.removeItem("apt");
        sessionStorage.removeItem("ame");
        sessionStorage.removeItem("aexp");
        router.push("/admin-portal/login");
    };

    const allFilled = digits.every((d) => d.length === 1);

    // Expired overlay
    if (expired && !maxAttemptsReached) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={cardStyle}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
                        <h2 style={{ color: "#F0F2F5", fontSize: 20, fontWeight: 500, margin: "0 0 8px" }}>
                            Code Expired
                        </h2>
                        <p style={{ color: "#8B8FA8", fontSize: 14, margin: "0 0 28px" }}>
                            This verification code has expired.
                        </p>
                        <button onClick={returnToLogin} style={primaryButtonStyle}>
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Max attempts overlay
    if (maxAttemptsReached) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={cardStyle}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "rgba(239,68,68,0.12)", display: "inline-flex",
                            alignItems: "center", justifyContent: "center", marginBottom: 20,
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <h2 style={{ color: "#F0F2F5", fontSize: 20, fontWeight: 500, margin: "0 0 8px" }}>
                            Too many incorrect attempts
                        </h2>
                        <p style={{ color: "#8B8FA8", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>
                            For security, this session has been ended.<br />
                            Please start a new login.
                        </p>
                        <button onClick={returnToLogin} style={primaryButtonStyle}>
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div
                style={{
                    ...cardStyle,
                    animation: shaking
                        ? "adminShake 0.4s ease-in-out"
                        : "adminFadeInUp 0.4s ease-out both",
                }}
            >
                {/* Back button */}
                <button
                    onClick={returnToLogin}
                    style={{
                        background: "none", border: "none", color: "#8B8FA8",
                        fontSize: 13, cursor: "pointer", padding: "0 0 20px",
                        display: "flex", alignItems: "center", gap: 4,
                    }}
                >
                    ← Login
                </button>

                {/* Icon */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 56, height: 56, borderRadius: 16,
                        background: "rgba(0,212,170,0.1)",
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h1 style={{ color: "#F0F2F5", fontSize: 20, fontWeight: 500, textAlign: "center", margin: "0 0 8px" }}>
                    Check your email
                </h1>
                <p style={{ color: "#8B8FA8", fontSize: 13, textAlign: "center", margin: "0 0 4px" }}>
                    We sent a code to <strong style={{ color: "#F0F2F5" }}>{maskedEmail}</strong>
                </p>
                <p style={{ color: getTimerColor(), fontSize: 13, textAlign: "center", margin: "0 0 28px", fontFamily: "'JetBrains Mono', monospace" }}>
                    Code expires in {formatTime(secondsLeft)}
                </p>

                {/* OTP Boxes */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            autoFocus={i === 0}
                            disabled={loading}
                            style={{
                                width: 52,
                                height: 60,
                                background: "#1A1D24",
                                border: `1px solid ${
                                    digit
                                        ? "rgba(255,255,255,0.3)"
                                        : "rgba(255,255,255,0.1)"
                                }`,
                                borderRadius: 10,
                                color: "#F0F2F5",
                                fontSize: 24,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 500,
                                textAlign: "center",
                                textTransform: "uppercase",
                                outline: "none",
                                transition: "border-color 0.2s, box-shadow 0.2s",
                                caretColor: "#00D4AA",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#00D4AA";
                                e.target.style.boxShadow = "0 0 0 3px rgba(0,212,170,0.15)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = digit
                                    ? "rgba(255,255,255,0.3)"
                                    : "rgba(255,255,255,0.1)";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    ))}
                </div>

                {/* Attempts indicator dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: i < attemptsLeft ? "#EF4444" : "rgba(255,255,255,0.1)",
                                transition: "background 0.3s",
                            }}
                        />
                    ))}
                    <span style={{ color: "#4B5168", fontSize: 11, marginLeft: 4 }}>
                        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
                    </span>
                </div>

                {/* Error message card */}
                <div style={{ position: "relative", zIndex: 10 }}>
                    <AnimatePresence>
                        {showErrorCard && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                style={{
                                    position: "absolute",
                                    bottom: "100%",
                                    left: 0,
                                    right: 0,
                                    marginBottom: 16,
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
                                <div style={{ flex: 1, textAlign: "left" }}>
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

                {/* Verify button */}
                <button
                    onClick={handleManualSubmit}
                    disabled={!allFilled || loading}
                    style={{
                        ...primaryButtonStyle,
                        opacity: !allFilled || loading ? 0.4 : 1,
                        cursor: !allFilled || loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                            <circle cx="12" cy="12" r="10" stroke="#0A0B0D" strokeWidth="3" fill="none" strokeDasharray="31" strokeLinecap="round" />
                        </svg>
                    ) : (
                        "Verify Code"
                    )}
                </button>

                {/* Resend note */}
                <p style={{ margin: "20px 0 0", color: "#4B5168", fontSize: 12, textAlign: "center" }}>
                    Didn&apos;t receive the code?{" "}
                    <button
                        onClick={returnToLogin}
                        style={{
                            background: "none", border: "none", color: "#00D4AA",
                            fontSize: 12, cursor: "pointer", textDecoration: "underline",
                            padding: 0,
                        }}
                    >
                        Login again to resend
                    </button>
                </p>
            </div>
        </div>
    );
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 400,
    background: "rgba(26, 29, 36, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 40,
};

const primaryButtonStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    background: "#00D4AA",
    color: "#0A0B0D",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
};
