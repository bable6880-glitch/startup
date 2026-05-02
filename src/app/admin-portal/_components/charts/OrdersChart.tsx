"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function OrdersChart({ data }: { data: any[] }) {
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
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#A78BFA" }}>
                        Orders: {payload[0].value}
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
                Orders Volume (30 Days)
            </h3>
            <div style={{ flex: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                        <Bar 
                            dataKey="count" 
                            fill="#A78BFA" 
                            radius={[4, 4, 0, 0]} 
                            barSize={8}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
