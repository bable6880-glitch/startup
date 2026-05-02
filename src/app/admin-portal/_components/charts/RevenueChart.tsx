"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePrivacy, SensitiveValue } from "../PrivacyMode";

export function RevenueChart({ data }: { data: any[] }) {
    const { isPrivacyMode } = usePrivacy();

    const formatYAxis = (tickItem: number) => {
        if (tickItem === 0) return "0";
        if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}k`;
        return tickItem.toString();
    };

    const formatTooltipValue = (value: number) => {
        return `Rs. ${value.toLocaleString()}`;
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
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#8B8FA8" }}>{label}</p>
                    {isPrivacyMode ? (
                        <p style={{ margin: 0, fontSize: 14 }}>
                            <span style={{ color: "#00D4AA" }}>GMV: </span> <SensitiveValue>HIDDEN</SensitiveValue>
                        </p>
                    ) : (
                        <>
                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>
                                <span style={{ color: "#00D4AA" }}>GMV: </span> {formatTooltipValue(payload[0].value)}
                            </p>
                            {payload[1] && (
                                <p style={{ margin: 0, fontSize: 13, color: "#3B82F6" }}>
                                    Commission: {formatTooltipValue(payload[1].value)}
                                </p>
                            )}
                        </>
                    )}
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
                Revenue & Commission (30 Days)
            </h3>
            <div style={{ flex: 1, minHeight: 300, filter: isPrivacyMode ? "blur(4px)" : "none", transition: "filter 0.3s" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
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
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="gmv" 
                            stroke="#00D4AA" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorGmv)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="commission" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCommission)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
