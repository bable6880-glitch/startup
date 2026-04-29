"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowDownRight, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function KhataDashboardPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const res = await fetch("/api/seller/khata");
            const data = await res.json();
            
            if (res.status === 403) {
                setError(data.error || "This feature requires the Elite plan.");
                setLoading(false);
                return;
            }
            
            if (data.success) {
                setEntries(data.entries);
            }
        } catch (err) {
            setError("Failed to load khata entries");
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="container py-8 max-w-4xl mx-auto space-y-6">
                <Alert className="border-red-500 bg-red-50 text-red-900">
                    <AlertTitle className="text-red-800">Access Denied</AlertTitle>
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
                <div className="text-center py-10">
                    <Button onClick={() => window.location.href = '/dashboard/subscription'}>
                        Upgrade Plan
                    </Button>
                </div>
            </div>
        );
    }

    const totalIncome = entries.filter(e => e.isCredit).reduce((sum, e) => sum + Number(e.amountRs), 0);
    const totalExpense = entries.filter(e => !e.isCredit).reduce((sum, e) => sum + Number(e.amountRs), 0);
    const netBalance = totalIncome - totalExpense;

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Digital Khata</h1>
                    <p className="text-muted-foreground mt-1">Manage your expenses, commissions, and revenue automatically.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add Entry
                </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs {netBalance.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {totalIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {totalExpense.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Ledger Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
                        </div>
                    ) : entries.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">{entry.entryDate}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`px-2 py-1 rounded-full text-xs ${entry.isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {entry.entryType}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">{entry.description}</td>
                                            <td className={`p-4 align-middle text-right font-semibold ${entry.isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.isCredit ? '+' : '-'} Rs {entry.amountRs}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No ledger entries found. They will appear here when orders are completed or manually added.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
