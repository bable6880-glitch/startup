"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";

const PAKISTAN_CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
    "Hyderabad", "Abbottabad"
];

export default function ProfilePage() {
    const { user, getIdToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        defaultCity: "",
        defaultAddress: "",
    });

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/account/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    const p = d.data ?? d;
                    setForm({
                        name: p.name ?? "",
                        phone: p.phone ?? "",
                        defaultCity: p.defaultCity ?? "",
                        defaultAddress: p.defaultAddress ?? "",
                    });
                }
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, getIdToken]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getIdToken();
            const res = await fetch("/api/account/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setToast({ msg: "Profile updated successfully ✓", type: "success" });
            } else {
                setToast({ msg: "Failed to save. Please try again.", type: "error" });
            }
        } catch {
            setToast({ msg: "Network error. Please try again.", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-40 bg-neutral-200 rounded-lg dark:bg-neutral-700" />
                <div className="h-64 bg-neutral-200 rounded-2xl dark:bg-neutral-700" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
                    {toast.msg}
                </div>
            )}

            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Profile Settings</h1>

            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700 space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                    />
                </div>

                {/* Email (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email Address</label>
                    <input
                        type="email"
                        value={user?.email ?? ""}
                        disabled
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500 cursor-not-allowed dark:bg-neutral-700/50 dark:border-neutral-600 dark:text-neutral-400"
                    />
                    <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone Number</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="03XX-XXXXXXX"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                    />
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Default City</label>
                    <select
                        value={form.defaultCity}
                        onChange={e => setForm(f => ({ ...f, defaultCity: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                    >
                        <option value="">Select city...</option>
                        {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Default Delivery Address <span className="text-neutral-400 font-normal">(optional)</span></label>
                    <textarea
                        value={form.defaultAddress}
                        onChange={e => setForm(f => ({ ...f, defaultAddress: e.target.value }))}
                        placeholder="Street address, neighbourhood..."
                        rows={3}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                    />
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}