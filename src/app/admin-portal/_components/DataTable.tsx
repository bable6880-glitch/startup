"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
    };
    actions?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
    data,
    columns,
    onSearch,
    searchPlaceholder = "Search...",
    onRowClick,
    isLoading,
    pagination,
    actions,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (onSearch) {
            // In a real app, you'd debounce this
            onSearch(e.target.value);
        }
    };

    return (
        <div style={{
            background: "rgba(26, 29, 36, 0.6)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Toolbar */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ position: "relative", width: 300 }}>
                    <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8B8FA8" }} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={handleSearch}
                        style={{
                            width: "100%", padding: "10px 12px 10px 40px",
                            background: "rgba(10, 11, 13, 0.5)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8, color: "#F0F2F5", fontSize: 14, outline: "none",
                            transition: "border-color 0.2s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#00D4AA"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                            {columns.map((col, i) => (
                                <th key={i} style={{ padding: "16px 24px", color: "#8B8FA8", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th style={{ padding: "16px 24px", width: 80 }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 40, textAlign: "center", color: "#8B8FA8" }}>
                                    Loading data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 40, textAlign: "center", color: "#8B8FA8" }}>
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    style={{
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        cursor: onRowClick ? "pointer" : "default",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} style={{ padding: "16px 24px", color: "#F0F2F5", fontSize: 14 }}>
                                            {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : ""}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td style={{ padding: "16px 24px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: "inline-block" }}>
                                                {actions(item)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8B8FA8", fontSize: 13 }}>
                        Showing {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} entries
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36,
                                background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: pagination.page === 1 ? "#4B5168" : "#F0F2F5",
                                cursor: pagination.page === 1 ? "not-allowed" : "pointer"
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={pagination.page * pagination.pageSize >= pagination.total}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36,
                                background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8,
                                color: pagination.page * pagination.pageSize >= pagination.total ? "#4B5168" : "#F0F2F5",
                                cursor: pagination.page * pagination.pageSize >= pagination.total ? "not-allowed" : "pointer"
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
