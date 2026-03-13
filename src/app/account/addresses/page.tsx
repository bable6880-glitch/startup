"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState, useCallback } from "react";
import { AddressModal, type Address } from "@/components/dashboard/buyer/AddressModal";

export default function AddressesPage() {
    const { user, getIdToken } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const loadAddresses = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await getIdToken();
            const res = await fetch("/api/account/addresses", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch addresses:", err);
        } finally {
            setLoading(false);
        }
    }, [user, getIdToken]);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/account/addresses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setAddresses(prev => prev.filter(a => a.id !== id));
            } else {
                alert("Failed to delete address");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/account/addresses/${id}/default`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setAddresses(prev => prev.map(a => ({
                    ...a,
                    isDefault: a.id === id
                })));
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };

    const openCreate = () => {
        setEditingAddress(null);
        setModalOpen(true);
    };

    const openEdit = (address: Address) => {
        setEditingAddress(address);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Delivery Addresses</h1>
                <button
                    onClick={openCreate}
                    className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors dark:border-primary-900/50 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
                >
                    + Add New
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-800" />
                    ))}
                </div>
            ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`relative rounded-2xl border p-5 transition-shadow hover:shadow-md dark:bg-neutral-800 ${address.isDefault
                                    ? "border-primary-500 bg-primary-50/30 dark:border-primary-500/50 dark:bg-primary-900/10"
                                    : "border-neutral-200/60 bg-white dark:border-neutral-700"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-neutral-900 capitalize dark:text-neutral-100">
                                        {address.label}
                                    </h3>
                                    {address.isDefault && (
                                        <span className="rounded bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(address)}
                                        className="text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                                        aria-label="Edit address"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                                        aria-label="Delete address"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                <p>{address.streetAddress}</p>
                                {address.apartment && <p>{address.apartment}</p>}
                                <p>{address.city}{address.postalCode && `, ${address.postalCode}`}</p>
                                {address.instructions && (
                                    <p className="mt-2 text-xs italic text-neutral-500">
                                        Note: {address.instructions}
                                    </p>
                                )}
                            </div>

                            {!address.isDefault && (
                                <button
                                    onClick={() => handleSetDefault(address.id)}
                                    className="mt-4 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                                >
                                    Set as default
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <span className="text-4xl block mb-3">🏠</span>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">No addresses saved yet</p>
                    <p className="text-sm text-neutral-400 mt-1 dark:text-neutral-500">Add an address for faster checkout.</p>
                    <button
                        onClick={openCreate}
                        className="mt-4 inline-block rounded-xl bg-white px-5 py-2 text-sm font-medium text-primary-600 shadow-sm border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-primary-400 dark:border-neutral-700 dark:hover:bg-neutral-700"
                    >
                        Add Address
                    </button>
                </div>
            )}

            {modalOpen && (
                <AddressModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={loadAddresses}
                    editingAddress={editingAddress}
                />
            )}
        </div>
    );
}
