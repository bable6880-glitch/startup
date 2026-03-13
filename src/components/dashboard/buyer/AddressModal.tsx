"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useState, useEffect } from "react";

export type Address = {
    id: string;
    label: string;
    streetAddress: string;
    apartment?: string | null;
    city: string;
    postalCode?: string | null;
    instructions?: string | null;
    isDefault: boolean;
};

type AddressModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingAddress?: Address | null;
};

export function AddressModal({ isOpen, onClose, onSuccess, editingAddress }: AddressModalProps) {
    const { getIdToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        label: "home",
        streetAddress: "",
        apartment: "",
        city: "",
        postalCode: "",
        instructions: "",
        isDefault: false
    });

    useEffect(() => {
        if (editingAddress) {
            setFormData({
                label: editingAddress.label,
                streetAddress: editingAddress.streetAddress,
                apartment: editingAddress.apartment || "",
                city: editingAddress.city,
                postalCode: editingAddress.postalCode || "",
                instructions: editingAddress.instructions || "",
                isDefault: editingAddress.isDefault
            });
        } else {
            setFormData({
                label: "home",
                streetAddress: "",
                apartment: "",
                city: "",
                postalCode: "",
                instructions: "",
                isDefault: false
            });
        }
    }, [editingAddress, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await getIdToken();
            const url = editingAddress
                ? `/api/account/addresses/${editingAddress.id}`
                : "/api/account/addresses";
            const method = editingAddress ? "PUT" : "POST";

            const payload = {
                ...formData,
                isDefault: Boolean(formData.isDefault),
                apartment: formData.apartment || null,
                postalCode: formData.postalCode || null,
                instructions: formData.instructions || null,
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save address");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                        {editingAddress ? "Edit Address" : "Add Address"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Label</label>
                        <select
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Street Address</label>
                        <input
                            required
                            type="text"
                            placeholder="Street, House No, etc."
                            value={formData.streetAddress}
                            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Apartment (Optional)</label>
                            <input
                                type="text"
                                placeholder="Apt, Suite"
                                value={formData.apartment}
                                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">City</label>
                            <input
                                required
                                type="text"
                                placeholder="City"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Delivery Instructions (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="E.g. Call upon arrival, leave at gate"
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 resize-none"
                        />
                    </div>

                    <div className="flex items-center pt-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-700"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                            Set as default delivery address
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Address"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
