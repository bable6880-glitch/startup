"use client";

import React, { useEffect, useState } from "react";
import { Settings2, Save, X } from "lucide-react";
import { EntityDrawer } from "../_components/EntityDrawer";

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/admin-portal/plans");
            if (res.ok) {
                const json = await res.json();
                setPlans(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch plans", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEditPlan = (plan: any) => {
        setSelectedPlan(plan);
        setEditForm({
            displayName: plan.displayName,
            priceRs: plan.priceRs,
            commissionRate: plan.commissionRate,
            menuItemLimit: plan.menuItemLimit,
            potluckUsesPerPeriod: plan.potluckUsesPerPeriod,
            isActive: plan.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        if (!selectedPlan) return;
        setSaving(true);

        try {
            const res = await fetch("/api/admin-portal/plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedPlan.id,
                    updates: {
                        displayName: editForm.displayName,
                        priceRs: Number(editForm.priceRs),
                        commissionRate: Number(editForm.commissionRate),
                        menuItemLimit: editForm.menuItemLimit ? Number(editForm.menuItemLimit) : null,
                        potluckUsesPerPeriod: Number(editForm.potluckUsesPerPeriod),
                        isActive: editForm.isActive,
                    }
                })
            });

            if (res.ok) {
                const json = await res.json();
                setPlans(plans.map(p => p.id === selectedPlan.id ? json.plan : p));
                setIsDrawerOpen(false);
            } else {
                alert("Failed to save plan");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving plan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, height: "100%" }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 24, fontWeight: 600 }}>Plan Configuration</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Manage subscription tiers, limits, and commission rates dynamically.</p>
            </div>

            {loading ? (
                <div style={{ color: "#8B8FA8" }}>Loading plans...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                    {plans.map(plan => (
                        <div 
                            key={plan.id}
                            style={{ 
                                background: "rgba(26, 29, 36, 0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
                                padding: 24, display: "flex", flexDirection: "column", gap: 20
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ margin: "0 0 4px", color: "#F0F2F5", fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                        {plan.displayName}
                                        {!plan.isActive && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.1)", color: "#EF4444", borderRadius: 4 }}>INACTIVE</span>}
                                    </h3>
                                    <span style={{ color: "#8B8FA8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>{plan.planId}</span>
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 600, color: "#00D4AA" }}>
                                    Rs. {plan.priceRs.toLocaleString()}
                                    <span style={{ fontSize: 14, color: "#8B8FA8", fontWeight: 400 }}>/mo</span>
                                </div>
                            </div>

                            <div style={{ background: "rgba(10, 11, 13, 0.5)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#8B8FA8", fontSize: 13 }}>Commission Rate</span>
                                    <span style={{ color: "#A78BFA", fontSize: 13, fontWeight: 600 }}>{(plan.commissionRate * 100).toFixed(1)}%</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#8B8FA8", fontSize: 13 }}>Menu Items Limit</span>
                                    <span style={{ color: "#F0F2F5", fontSize: 13 }}>{plan.menuItemLimit || "Unlimited"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#8B8FA8", fontSize: 13 }}>Potluck Uses/Mo</span>
                                    <span style={{ color: "#F0F2F5", fontSize: 13 }}>{plan.potluckUsesPerPeriod}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleEditPlan(plan)}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    width: "100%", padding: "10px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: "rgba(255,255,255,0.05)", color: "#F0F2F5", border: "none",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            >
                                <Settings2 size={18} />
                                Configure Plan
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <EntityDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={`Edit ${selectedPlan?.displayName}`}>
                {selectedPlan && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ color: "#8B8FA8", fontSize: 13 }}>Display Name</label>
                            <input 
                                value={editForm.displayName}
                                onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                                style={{ padding: 12, borderRadius: 8, background: "rgba(10, 11, 13, 0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F5" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ color: "#8B8FA8", fontSize: 13 }}>Monthly Price (PKR)</label>
                            <input 
                                type="number"
                                value={editForm.priceRs}
                                onChange={e => setEditForm({...editForm, priceRs: e.target.value})}
                                style={{ padding: 12, borderRadius: 8, background: "rgba(10, 11, 13, 0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#00D4AA" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ color: "#8B8FA8", fontSize: 13 }}>Commission Rate (e.g. 0.05 = 5%)</label>
                            <input 
                                type="number" step="0.01"
                                value={editForm.commissionRate}
                                onChange={e => setEditForm({...editForm, commissionRate: e.target.value})}
                                style={{ padding: 12, borderRadius: 8, background: "rgba(10, 11, 13, 0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#A78BFA" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 16 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                <label style={{ color: "#8B8FA8", fontSize: 13 }}>Menu Item Limit</label>
                                <input 
                                    type="number"
                                    value={editForm.menuItemLimit || ""}
                                    onChange={e => setEditForm({...editForm, menuItemLimit: e.target.value})}
                                    placeholder="Leave empty for unlimited"
                                    style={{ padding: 12, borderRadius: 8, background: "rgba(10, 11, 13, 0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F5" }}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                <label style={{ color: "#8B8FA8", fontSize: 13 }}>Potluck Uses / Mo</label>
                                <input 
                                    type="number"
                                    value={editForm.potluckUsesPerPeriod}
                                    onChange={e => setEditForm({...editForm, potluckUsesPerPeriod: e.target.value})}
                                    style={{ padding: 12, borderRadius: 8, background: "rgba(10, 11, 13, 0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F5" }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={editForm.isActive}
                                onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                                style={{ width: 18, height: 18, accentColor: "#00D4AA", cursor: "pointer" }}
                            />
                            <label htmlFor="isActive" style={{ color: "#F0F2F5", fontSize: 14, cursor: "pointer" }}>Plan is Active</label>
                        </div>

                        <div style={{ marginTop: "auto", paddingTop: 32, display: "flex", gap: 16 }}>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: "transparent", color: "#8B8FA8", border: "1px solid rgba(255,255,255,0.1)",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                    background: "rgba(0, 212, 170, 0.1)", color: "#00D4AA", border: "1px solid rgba(0, 212, 170, 0.2)",
                                    cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}
            </EntityDrawer>
        </div>
    );
}
