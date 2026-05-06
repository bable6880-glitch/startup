"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../_components/DataTable";
import { EntityDrawer } from "../_components/EntityDrawer";
import { usePrivacy, SensitiveValue } from "../_components/PrivacyMode";
import { BadgeCheck, Ban, Power, MapPin } from "lucide-react";

export default function AdminKitchensPage() {
    const { isPrivacyMode } = usePrivacy();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const [selectedKitchen, setSelectedKitchen] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchKitchens = async (currentPage: number, currentSearch: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-portal/kitchens?page=${currentPage}&limit=${limit}&search=${currentSearch}`);
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
            console.error("Failed to fetch kitchens", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchens(page, search);
    }, [page, search]);

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1);
    };

    const fetchKitchenDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/admin-portal/kitchens/${id}`);
            if (res.ok) {
                const json = await res.json();
                setSelectedKitchen(json.kitchen);
                setIsDrawerOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch kitchen details", error);
        }
    };

    const updateKitchen = async (id: string, updates: any) => {
        try {
            const res = await fetch(`/api/admin-portal/kitchens/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const json = await res.json();
                const updated = json.kitchen;
                
                setData(data.map(k => k.id === id ? { ...k, ...updates } : k));
                if (selectedKitchen && selectedKitchen.id === id) {
                    setSelectedKitchen({ ...selectedKitchen, ...updates });
                }
            } else {
                alert("Failed to update kitchen");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating kitchen");
        }
    };

    const columns: Column<any>[] = [
        {
            header: "Kitchen",
            cell: (kitchen) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#FFF", fontWeight: 600, fontSize: 14
                    }}>
                        {(kitchen.name || "K").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            {kitchen.name}
                            {kitchen.isVerified && <BadgeCheck size={14} color="#10B981" />}
                        </div>
                        <div style={{ fontSize: 12, color: "#8B8FA8" }}>
                            {kitchen.ownerName || kitchen.ownerEmail}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: "Location",
            cell: (kitchen) => (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8FA8", fontSize: 13 }}>
                    <MapPin size={14} />
                    {kitchen.city}
                </span>
            ),
        },
        {
            header: "Status",
            cell: (kitchen) => {
                let color = "#8B8FA8";
                if (kitchen.status === "ACTIVE") color = "#10B981";
                if (kitchen.status === "SUSPENDED") color = "#EF4444";
                
                return (
                    <span style={{
                        padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: `${color}1A`, color: color
                    }}>
                        {kitchen.status}
                    </span>
                );
            },
        },
        {
            header: "Joined",
            cell: (kitchen) => (
                <span style={{ color: "#8B8FA8" }}>
                    {new Date(kitchen.createdAt).toLocaleDateString()}
                </span>
            ),
        }
    ];

    const actions = (kitchen: any) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                fetchKitchenDetails(kitchen.id);
            }}
            style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#F0F2F5", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                cursor: "pointer", transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
            Manage
        </button>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Kitchens Management</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>View, verify, and moderate partner kitchens.</p>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onSearch={handleSearch}
                searchPlaceholder="Search by name or city..."
                onRowClick={(k) => fetchKitchenDetails(k.id)}
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
                title="Kitchen Details"
            >
                {selectedKitchen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {/* Profile Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "8px",
                                background: selectedKitchen.profileImageUrl ? `url(${selectedKitchen.profileImageUrl}) center/cover` : "linear-gradient(135deg, #F59E0B, #EF4444)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#FFF", fontWeight: 600, fontSize: 24
                            }}>
                                {!selectedKitchen.profileImageUrl && (selectedKitchen.name || "K").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: "0 0 4px", color: "#F0F2F5", fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                    {selectedKitchen.name}
                                    {selectedKitchen.isVerified && <BadgeCheck size={18} color="#10B981" />}
                                </h3>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                        background: selectedKitchen.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        color: selectedKitchen.status === "ACTIVE" ? "#10B981" : "#EF4444"
                                    }}>
                                        {selectedKitchen.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ margin: 0, color: "#8B8FA8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Owner Info</h4>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Name</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{selectedKitchen.owner?.name || "N/A"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Email</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{isPrivacyMode ? <SensitiveValue>hidden@email.com</SensitiveValue> : selectedKitchen.owner?.email}</span>
                            </div>

                            <h4 style={{ margin: "16px 0 0", color: "#8B8FA8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Kitchen Info</h4>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>City</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14 }}>{selectedKitchen.city}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Rating</span>
                                <span style={{ color: "#F59E0B", fontSize: 14, fontWeight: 500 }}>★ {selectedKitchen.avgRating} ({selectedKitchen.reviewCount})</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                                <span style={{ color: "#8B8FA8", fontSize: 14 }}>Address</span>
                                <span style={{ color: "#F0F2F5", fontSize: 14, textAlign: "right", maxWidth: 200 }}>
                                    {isPrivacyMode ? <SensitiveValue>Hidden Address</SensitiveValue> : (selectedKitchen.addressLine || "N/A")}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: "auto", paddingTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                            <button
                                onClick={() => {
                                    if(confirm(`Toggle verification for ${selectedKitchen.name}?`)) {
                                        updateKitchen(selectedKitchen.id, { isVerified: !selectedKitchen.isVerified });
                                    }
                                }}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    width: "100%", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: selectedKitchen.isVerified ? "rgba(255,255,255,0.05)" : "rgba(16, 185, 129, 0.1)",
                                    color: selectedKitchen.isVerified ? "#8B8FA8" : "#34D399",
                                    border: `1px solid ${selectedKitchen.isVerified ? "rgba(255,255,255,0.1)" : "rgba(16, 185, 129, 0.2)"}`,
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                <BadgeCheck size={18} />
                                {selectedKitchen.isVerified ? "Remove Verification Badge" : "Add Verification Badge"}
                            </button>

                            <button
                                onClick={() => {
                                    const newStatus = selectedKitchen.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                                    if(confirm(`Are you sure you want to change status to ${newStatus}?`)) {
                                        updateKitchen(selectedKitchen.id, { status: newStatus });
                                    }
                                }}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    width: "100%", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: selectedKitchen.status === "ACTIVE" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                    color: selectedKitchen.status === "ACTIVE" ? "#F87171" : "#34D399",
                                    border: `1px solid ${selectedKitchen.status === "ACTIVE" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                {selectedKitchen.status === "ACTIVE" ? <Ban size={18} /> : <Power size={18} />}
                                {selectedKitchen.status === "ACTIVE" ? "Suspend Kitchen" : "Reactivate Kitchen"}
                            </button>
                        </div>
                    </div>
                )}
            </EntityDrawer>
        </div>
    );
}
