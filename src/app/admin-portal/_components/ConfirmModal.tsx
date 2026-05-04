"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "primary" | "success";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    isLoading = false
}: ConfirmModalProps) {
    
    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const getColors = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <AlertCircle className="w-6 h-6 text-red-500" />,
                    bgIcon: "rgba(239, 68, 68, 0.1)",
                    btnBg: "#EF4444",
                    btnHover: "#DC2626",
                    btnBorder: "rgba(239, 68, 68, 0.5)",
                    shadow: "0 8px 32px rgba(239, 68, 68, 0.2)"
                };
            case "success":
                return {
                    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                    bgIcon: "rgba(16, 185, 129, 0.1)",
                    btnBg: "#10B981",
                    btnHover: "#059669",
                    btnBorder: "rgba(16, 185, 129, 0.5)",
                    shadow: "0 8px 32px rgba(16, 185, 129, 0.2)"
                };
            case "primary":
            default:
                return {
                    icon: <AlertCircle className="w-6 h-6 text-blue-500" />,
                    bgIcon: "rgba(59, 130, 246, 0.1)",
                    btnBg: "#3B82F6",
                    btnHover: "#2563EB",
                    btnBorder: "rgba(59, 130, 246, 0.5)",
                    shadow: "0 8px 32px rgba(59, 130, 246, 0.2)"
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={!isLoading ? onClose : undefined}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-[#0D0E12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                    >
                        {/* Header Glow Effect */}
                        <div 
                            className="absolute top-0 left-0 right-0 h-1" 
                            style={{ background: colors.btnBg, boxShadow: colors.shadow }} 
                        />

                        {/* Close Button */}
                        <button 
                            onClick={!isLoading ? onClose : undefined}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                            disabled={isLoading}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 sm:p-8 flex flex-col gap-6">
                            {/* Icon & Title */}
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: colors.bgIcon }}
                                >
                                    {colors.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        {title}
                                    </h2>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="text-[15px] leading-relaxed text-gray-400">
                                {description}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-5 sm:px-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                                style={{ 
                                    background: colors.btnBg,
                                    border: `1px solid ${colors.btnBorder}`,
                                    boxShadow: colors.shadow
                                }}
                                onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = colors.btnHover)}
                                onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = colors.btnBg)}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
