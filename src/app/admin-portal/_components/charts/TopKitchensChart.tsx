"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePrivacy, SensitiveValue } from "../PrivacyMode";

export function TopKitchensChart({ data }: { data: any[] }) {
    const { isPrivacyMode } = usePrivacy();

    const formatXAxis = (tickItem: number) => {
        if (tickItem === 0) return "0";
        if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}k`;
        return tickItem.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: "rgba(26, 29, 36, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    color: "#F0F2F5"
                }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "#8B8FA8" }}>{label}</p>
                    {isPrivacyMode ? (
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#3B82F6" }}>
                            Revenue: <SensitiveValue>HIDDEN</SensitiveValue>
                        </p>
                    ) : (
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#3B82F6" }}>
                            Revenue: Rs. {payload[0].value.toLocaleString()}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Sort descending for horizontal bar chart so highest is at top
    const sortedData = [...data].sort((a, b) => a.revenue - b.revenue);

    return (
        <div style={{
            background: "rgba(26, 29, 36, 0.6)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 24,
            height: "100%",
            display: "flex",
            flexDirection: "column",
        }}>
            <h3 style={{ margin: "0 0 24px", color: "#F0F2F5", fontSize: 16, fontWeight: 500 }}>
                Top 10 Kitchens by Revenue
            </h3>
            <div style={{ flex: 1, minHeight: 300, filter: isPrivacyMode ? "blur(4px)" : "none", transition: "filter 0.3s" }}>
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis 
                                type="number"
                                stroke="#4B5168" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={formatXAxis}
                            />
                            <YAxis 
                                type="category"
                                dataKey="name"
                                stroke="#8B8FA8" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                width={80}
                                tickFormatter={(val) => val.length > 12 ? val.substring(0, 10) + "..." : val}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                            <Bar 
                                dataKey="revenue" 
                                fill="#3B82F6" 
                                radius={[0, 4, 4, 0]} 
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <p style={{ color: "#4B5168", fontSize: 14 }}>No data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
