"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../_components/DataTable";
import { EntityDrawer } from "../_components/EntityDrawer";
import { ConfirmModal } from "../_components/ConfirmModal";
import { usePrivacy, SensitiveValue } from "../_components/PrivacyMode";
import { Shield, ShieldOff, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
    const { isPrivacyMode } = usePrivacy();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const limit = 10;

    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalUser, setModalUser] = useState<any | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    const fetchUsers = async (currentPage: number, currentSearch: string, currentRole: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-portal/users?page=${currentPage}&limit=${limit}&search=${currentSearch}&role=${currentRole}`);
            if (res.status === 401) {
                window.location.href = "/admin-portal/login";
                return;
            }
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                setTotal(json.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page, search, roleFilter);
    }, [page, search, roleFilter]);

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1); // Reset to first page on new search
    };

    const handleRoleChange = (role: string) => {
        if (roleFilter === role) return;
        setRoleFilter(role);
        setPage(1);
    };

    const handleRowClick = (user: any) => {
        setSelectedUser(user);
        setIsDrawerOpen(true);
    };

    const openBanModal = (user: any) => {
        setModalUser(user);
        setIsModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!modalUser) return;
        setIsModalLoading(true);

        const newStatus = !modalUser.isActive;
        try {
            const res = await fetch(`/api/admin-portal/users/${modalUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (res.ok) {
                setData(data.map(u => u.id === modalUser.id ? { ...u, isActive: newStatus } : u));
                if (selectedUser && selectedUser.id === modalUser.id) {
                    setSelectedUser({ ...selectedUser, isActive: newStatus });
                }
                setIsModalOpen(false);
            } else {
                alert("Failed to update user status");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating user");
        } finally {
            setIsModalLoading(false);
        }
    };

    const columns: Column<any>[] = [
        {
            header: "User",
            cell: (user) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#FFF", fontWeight: 600, fontSize: 14
                    }}>
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{user.name || "Unnamed User"}</div>
                        <div style={{ fontSize: 12, color: "#8B8FA8" }}>
                            {isPrivacyMode ? <SensitiveValue>hidden@email.com</SensitiveValue> : user.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: "Role",
            cell: (user) => (
                <span style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: user.role === "COOK" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
                    color: user.role === "COOK" ? "#F59E0B" : "#3B82F6"
                }}>
                    {user.role}
                </span>
            ),
        },
        {
            header: "Phone",
            cell: (user) => (
                <span style={{ color: "#8B8FA8" }}>
                    {isPrivacyMode ? <SensitiveValue>+92 3** *******</SensitiveValue> : (user.phone || "Not provided")}
                </span>
            ),
        },
        {
            header: "Status",
            cell: (user) => (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    color: user.isActive ? "#10B981" : "#EF4444", fontSize: 13, fontWeight: 500
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                    {user.isActive ? "Active" : "Banned"}
                </span>
            ),
        },
        {
            header: "Joined",
            cell: (user) => (
                <span style={{ color: "#8B8FA8" }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                </span>
            ),
        }
    ];

    const actions = (user: any) => (
        <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e: any) => {
                e.stopPropagation();
                openBanModal(user);
            }}
            title={user.isActive ? "Ban User" : "Unban User"}
            style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: user.isActive ? "#EF4444" : "#10B981", padding: 8, borderRadius: 8,
                transition: "background 0.2s"
            }}
            onMouseOver={(e: any) => e.currentTarget.style.background = user.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)"}
            onMouseOut={(e: any) => e.currentTarget.style.background = "transparent"}
        >
            {user.isActive ? <ShieldOff size={18} /> : <Shield size={18} />}
        </motion.button>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>User Management</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>View, search, and manage platform users.</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", padding: 6, borderRadius: 16, width: "fit-content" }}>
                {["ALL", "CUSTOMER", "COOK", "ADMIN"].map((tab) => {
                    const isActive = roleFilter === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => handleRoleChange(tab)}
                            style={{
                                position: "relative",
                                padding: "8px 20px",
                                borderRadius: "10px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: isActive ? "#FFF" : "#8B8FA8",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                transition: "color 0.2s",
                                outline: "none",
                                letterSpacing: "0.5px"
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    style={{
                                        position: "absolute", inset: 0,
                                        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                                        border: "1px solid rgba(59,130,246,0.3)",
                                        borderRadius: "10px", zIndex: 0
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span style={{ position: "relative", zIndex: 1 }}>
                                {tab === "ALL" ? "All Users" : tab + "S"}
                            </span>
                        </button>
                    );
                })}
            </div>

            <DataTable
                data={data}
                columns={columns}
                onSearch={handleSearch}
                searchPlaceholder="Search by name, email, or phone..."
                onRowClick={handleRowClick}
                isLoading={loading}
                actions={actions}
                pagination={{
                    page,
                    pageSize: limit,
                    total,
                    onPageChange: setPage
                }}
            />

            <EntityDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="User Details"
            >
                {selectedUser && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {/* Profile Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#FFF", fontWeight: 600, fontSize: 24
                            }}>
                                {(selectedUser.name || selectedUser.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: "0 0 4px", color: "#F0F2F5", fontSize: 20, fontWeight: 600 }}>
                                    {selectedUser.name || "Unnamed User"}
                                </h3>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                        background: selectedUser.role === "COOK" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                        color: selectedUser.role === "COOK" ? "#F59E0B" : "#3B82F6"
                                    }}>
                                        {selectedUser.role}
                                    </span>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                        background: selectedUser.isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        color: selectedUser.isActive ? "#10B981" : "#EF4444"
                                    }}>
                                        {selectedUser.isActive ? "ACTIVE" : "BANNED"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ margin: 0, color: "#8B8FA8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Contact Info</h4>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Email</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{isPrivacyMode ? <SensitiveValue>hidden@email.com</SensitiveValue> : selectedUser.email}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Phone</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{isPrivacyMode ? <SensitiveValue>+92 *** *******</SensitiveValue> : (selectedUser.phone || "N/A")}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Joined</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>User ID</span>
                                <span style={{ color: "#4B5168", fontSize: 12, fontFamily: "monospace" }}>{selectedUser.id}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: "auto", paddingTop: 32 }}>
                            <button
                                onClick={() => openBanModal(selectedUser)}
                                style={{
                                    width: "100%", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: selectedUser.isActive ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                    color: selectedUser.isActive ? "#F87171" : "#34D399",
                                    border: `1px solid ${selectedUser.isActive ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                                onMouseOver={(e: any) => e.currentTarget.style.background = selectedUser.isActive ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}
                                onMouseOut={(e: any) => e.currentTarget.style.background = selectedUser.isActive ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)"}
                            >
                                {selectedUser.isActive ? "Ban User Account" : "Unban User Account"}
                            </button>
                        </div>
                    </div>
                )}
            </EntityDrawer>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => !isModalLoading && setIsModalOpen(false)}
                onConfirm={confirmToggleStatus}
                isLoading={isModalLoading}
                title={modalUser?.isActive ? "Ban User Account" : "Unban User Account"}
                description={
                    modalUser?.isActive ? (
                        <>
                            Are you sure you want to ban <strong style={{ color: "#FFF" }}>{modalUser.name || modalUser.email}</strong>? 
                            They will be immediately logged out and will not be able to access the platform.
                        </>
                    ) : (
                        <>
                            Are you sure you want to restore access for <strong style={{ color: "#FFF" }}>{modalUser?.name || modalUser?.email}</strong>?
                        </>
                    )
                }
                type={modalUser?.isActive ? "danger" : "success"}
                confirmText={modalUser?.isActive ? "Yes, Ban User" : "Yes, Unban User"}
            />
        </div>
    );
}
