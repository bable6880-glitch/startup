"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ['#00D4AA', '#3B82F6', '#A78BFA', '#F59E0B', '#EF4444', '#10B981'];

export function PlanDonut({ data }: { data: any[] }) {
    const CustomTooltip = ({ active, payload }: any) => {
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
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                        {payload[0].name}: <span style={{ color: payload[0].payload.fill }}>{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

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
                Active Subscriptions
            </h3>
            <div style={{ flex: 1, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: 12, color: "#8B8FA8" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p style={{ color: "#4B5168", fontSize: 14 }}>No active subscriptions</p>
                )}
            </div>
        </div>
    );
}
