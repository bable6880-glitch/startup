"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowDownRight, ArrowUpRight, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/BackButton";
import { useAuth } from "@/lib/firebase/auth-context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { FeatureGate } from "@/components/plans/FeatureGate";

export default function KhataDashboardPage() {
    const { getIdToken } = useAuth();
    const { data: planData, loading: planLoading } = usePlanAccess();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        entryType: "INCOME",
        category: "Sales",
        description: "",
        amountRs: "",
        isCredit: true,
        entryDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const res = await fetch("/api/seller/khata", {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        
        try {
            const token = await getIdToken();
            const res = await fetch("/api/seller/khata", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    entryType: formData.entryType,
                    category: formData.category,
                    description: formData.description,
                    amountRs: Number(formData.amountRs),
                    isCredit: formData.isCredit,
                    entryDate: formData.entryDate,
                })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                setIsModalOpen(false);
                setFormData({
                    entryType: "INCOME",
                    category: "Sales",
                    description: "",
                    amountRs: "",
                    isCredit: true,
                    entryDate: new Date().toISOString().split("T")[0],
                });
                fetchEntries();
            } else {
                setFormError(data.error || "Failed to add entry.");
            }
        } catch (err) {
            setFormError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-10 text-center max-w-md w-full shadow-sm">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow mb-6">
                            👑 Premium Feature
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Plan Required</h2>
                        <p className="text-sm text-gray-500 mb-7">
                            Digital Khata is available on the <strong>Pro</strong> plan and above. Upgrade to track your earnings, expenses, and P&amp;L automatically.
                        </p>
                        <a
                            href="/dashboard/subscription"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm px-7 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Upgrade to Pro →
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const totalIncome = entries.filter(e => e.isCredit).reduce((sum, e) => sum + Number(e.amountRs), 0);
    const totalExpense = entries.filter(e => !e.isCredit).reduce((sum, e) => sum + Number(e.amountRs), 0);
    const netBalance = totalIncome - totalExpense;

    if (planLoading) {
        return (
            <div className="container py-8 max-w-5xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-100 rounded" />
                    <div className="grid sm:grid-cols-3 gap-6">
                        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-6">
            <BackButton label="Dashboard" />

            {/* bypass=true: the /api/seller/khata API handles the real plan check.
                FeatureGate only shows the premium overlay if we're certain user has no plan. */}
            <FeatureGate
                feature="digital_khata"
                currentPlanId={planData?.planId ?? null}
                requiredPlan="pro"
                bypass={!planData || planData.isFree === false}
            >
            <div className="flex justify-between items-center mt-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Digital Khata</h1>
                    <p className="text-muted-foreground mt-1">Manage your expenses, commissions, and revenue automatically.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
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
                                                <span className={`px-2 py-1 rounded-full text-xs ${entry.isCredit ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {entry.entryType}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">{entry.description}</td>
                                            <td className={`p-4 align-middle text-right font-semibold ${entry.isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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

            {/* Add Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-xl font-bold">Add Ledger Entry</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full dark:hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                                    {formError}
                                </div>
                            )}
                            <form id="khataForm" onSubmit={handleAddEntry} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Entry Type *</label>
                                        <select 
                                            required 
                                            value={formData.entryType} 
                                            onChange={e => {
                                                const type = e.target.value;
                                                const isCredit = type === 'INCOME' || type === 'REFUND' || type === 'ADJUSTMENT';
                                                setFormData({...formData, entryType: type, isCredit});
                                            }} 
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50"
                                        >
                                            <option value="INCOME">Income</option>
                                            <option value="EXPENSE">Expense</option>
                                            <option value="WITHDRAWAL">Withdrawal</option>
                                            <option value="COMMISSION">Commission</option>
                                            <option value="REFUND">Refund</option>
                                            <option value="ADJUSTMENT">Adjustment</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Date *</label>
                                        <input required type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category *</label>
                                    <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g., Groceries, Delivery Fee..." className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description *</label>
                                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief details about the entry" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Amount (Rs) *</label>
                                        <input required type="number" min="1" value={formData.amountRs} onChange={e => setFormData({...formData, amountRs: e.target.value})} placeholder="e.g., 500" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="isCredit" checked={formData.isCredit} onChange={e => setFormData({...formData, isCredit: e.target.checked})} className="rounded text-primary-600 w-4 h-4" />
                                    <label htmlFor="isCredit" className="text-sm font-medium">This is a Credit (Income)</label>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 dark:bg-neutral-800 dark:border-neutral-800">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button form="khataForm" type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Entry
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            </FeatureGate>
        </div>
    );
}
