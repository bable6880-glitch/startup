"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type PrivacyContextType = {
    isPrivacyMode: boolean;
    togglePrivacyMode: () => void;
};

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    // Toggle with Ctrl+Shift+P
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
                e.preventDefault();
                setIsPrivacyMode((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode: () => setIsPrivacyMode(!isPrivacyMode) }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error("usePrivacy must be used within a PrivacyProvider");
    }
    return context;
}

/**
 * A wrapper component that blurs its children when Privacy Mode is active.
 * Used for financial data, PII, etc.
 */
export function SensitiveValue({ children, className = "" }: { children: ReactNode; className?: string }) {
    const { isPrivacyMode } = usePrivacy();

    return (
        <span
            className={className}
            style={{
                filter: isPrivacyMode ? "blur(6px)" : "none",
                opacity: isPrivacyMode ? 0.6 : 1,
                transition: "filter 0.3s ease, opacity 0.3s ease",
                userSelect: isPrivacyMode ? "none" : "auto",
                pointerEvents: isPrivacyMode ? "none" : "auto",
            }}
        >
            {children}
        </span>
    );
}
