"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function UserGrowthChart({ data }: { data: any[] }) {
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
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#8B8FA8" }}>{label}</p>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: "#00D4AA" }}>
                        Customers: {payload[0].value}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#F59E0B" }}>
                        Cooks: {payload[1].value}
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
                User Growth (30 Days)
            </h3>
            <div style={{ flex: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#4B5168" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                            }}
                        />
                        <YAxis 
                            stroke="#4B5168" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#8B8FA8" }} />
                        <Line 
                            type="monotone" 
                            dataKey="customers" 
                            name="Customers"
                            stroke="#00D4AA" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#00D4AA", stroke: "#0A0B0D", strokeWidth: 2 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="cooks" 
                            name="Cooks"
                            stroke="#F59E0B" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#F59E0B", stroke: "#0A0B0D", strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
