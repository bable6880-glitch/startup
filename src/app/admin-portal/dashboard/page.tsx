"use client";

import React, { useEffect, useState } from "react";
import { KPICard } from "../_components/KPICard";
import { RevenueChart } from "../_components/charts/RevenueChart";
import { OrdersChart } from "../_components/charts/OrdersChart";
import { PlanDonut } from "../_components/charts/PlanDonut";
import { UserGrowthChart } from "../_components/charts/UserGrowthChart";
import { TopKitchensChart } from "../_components/charts/TopKitchensChart";
import { DollarSign, Users, ChefHat, ShoppingBag, TrendingUp, Activity } from "lucide-react";

export default function AdminDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/admin-portal/analytics")
            .then(res => {
                if (!res.ok) throw new Error("Failed to load analytics");
                return res.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8B8FA8" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                        <circle cx="12" cy="12" r="10" stroke="rgba(0,212,170,0.2)" strokeWidth="3" fill="none" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#00D4AA" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </svg>
                    <span>Loading Command Center...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: 24, background: "rgba(239,68,68,0.1)", borderRadius: 16, border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Failed to load analytics</h3>
                <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
            </div>
        );
    }

    const { stats, charts } = data;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 60 }}>
            <div>
                <h1 style={{ margin: "0 0 8px", color: "#F0F2F5", fontSize: 28, fontWeight: 600 }}>Command Center</h1>
                <p style={{ margin: 0, color: "#8B8FA8", fontSize: 14 }}>Overview of Smart Tiffin platform performance.</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <KPICard 
                    title="Total GMV (30d)" 
                    value={stats.totalGMV} 
                    icon={<DollarSign size={20} />} 
                    isCurrency 
                    isSensitive 
                />
                <KPICard 
                    title="Total Commission" 
                    value={stats.totalCommission} 
                    icon={<TrendingUp size={20} />} 
                    isCurrency 
                    isSensitive 
                />
                <KPICard 
                    title="Live Orders" 
                    value={stats.liveOrdersCount} 
                    icon={<Activity size={20} />} 
                />
                <KPICard 
                    title="Total Orders" 
                    value={stats.totalOrders} 
                    icon={<ShoppingBag size={20} />} 
                />
                <KPICard 
                    title="Active Kitchens" 
                    value={stats.totalKitchens} 
                    icon={<ChefHat size={20} />} 
                />
                <KPICard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={<Users size={20} />} 
                />
            </div>

            {/* Primary Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <RevenueChart data={charts.revenue} />
                <PlanDonut data={charts.plans} />
            </div>

            {/* Secondary Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                <OrdersChart data={charts.orders} />
                <UserGrowthChart data={charts.userGrowth} />
                <TopKitchensChart data={charts.topKitchens} />
            </div>
        </div>
    );
}
