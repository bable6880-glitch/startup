"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Kitchen = {
    id: string;
    name: string;
    description: string | null;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    contactPhone: string | null;
    contactWhatsapp: string | null;
    deliveryOptions: string[] | null;
};

export default function KitchenSettingsPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [kitchen, setKitchen] = useState<Kitchen | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [deliveryOptions, setDeliveryOptions] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState<"profile" | "cover" | null>(null);

    const loadKitchen = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const res = await fetch("/api/kitchens?ownerId=me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const kitchens = data.data || [];
                if (kitchens.length > 0) {
                    const k = kitchens[0];
                    setKitchen(k);
                    setName(k.name || "");
                    setDescription(k.description || "");
                    setPhone(k.contactPhone || "");
                    setWhatsapp(k.contactWhatsapp || "");
                    setProfileImage(k.profileImageUrl || "");
                    setCoverImage(k.coverImageUrl || "");
                    setDeliveryOptions(k.deliveryOptions || ["SELF_PICKUP"]);
                }
            }
        } catch (err) {
            console.error("Load kitchen error:", err);
        } finally {
            setLoading(false);
        }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/seller/login");
            return;
        }
        if (user) loadKitchen();
    }, [user, authLoading, router, loadKitchen]);

    const toggleDelivery = (option: string) => {
        setDeliveryOptions((prev) =>
            prev.includes(option)
                ? prev.filter((o) => o !== option)
                : [...prev, option]
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(type);
        setMessage(null);

        try {
            const token = await getIdToken();
            if (!token) throw new Error("Unauthorized");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "kitchens");

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Upload failed");

            if (type === "profile") {
                setProfileImage(data.data.url);
            } else {
                setCoverImage(data.data.url);
            }
        } catch (err: unknown) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload image" });
        } finally {
            setUploadingImage(null);
            // reset file input
            e.target.value = "";
        }
    };

    const handleSave = async () => {
        if (!kitchen) return;
        setSaving(true);
        setMessage(null);
        try {
            const token = await getIdToken();
            if (!token) return;

            const res = await fetch(`/api/kitchens/${kitchen.id}/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description,
                    contactPhone: phone,
                    contactWhatsapp: whatsapp,
                    profileImageUrl: profileImage || null,
                    coverImageUrl: coverImage || null,
                    deliveryOptions: deliveryOptions.length > 0 ? deliveryOptions : ["SELF_PICKUP"],
                }),
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Settings saved successfully! ✅" });
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error?.message || "Failed to save" });
            }
        } catch {
            setMessage({ type: "error", text: "Something went wrong" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteImage = (type: "profile" | "cover") => {
        if (type === "profile") setProfileImage("");
        else setCoverImage("");
    };

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 rounded-lg animate-shimmer" />
                    <div className="h-64 rounded-2xl animate-shimmer" />
                </div>
            </div>
        );
    }

    if (!kitchen) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 text-center">
                <p className="text-neutral-500">No kitchen found. Please register first.</p>
                <Link href="/become-a-cook" className="mt-4 inline-block text-primary-600 font-semibold hover:underline">
                    Register Kitchen →
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Kitchen Settings</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Update your kitchen profile, images, and delivery options</p>
                </div>
                <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400">
                    ← Dashboard
                </Link>
            </div>

            {message && (
                <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-8">

                {/* ── Strict Profile Banner in Settings ── */}
                {(!profileImage || !coverImage) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5 dark:border-red-900/50 dark:bg-red-900/20">
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-red-800 dark:text-red-400">Action Required</h3>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                    <p>Please upload both a <strong>Profile Image</strong> and a <strong>Cover Image</strong> below to complete your kitchen setup. This is mandatory to attract customers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Kitchen Images ── */}
                <section id="kitchen-images" className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Kitchen Images</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Profile Image */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-300">
                                Profile Image
                            </label>
                            <div className="relative rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center dark:border-neutral-600">
                                {profileImage ? (
                                    <div className="relative">
                                        <img src={profileImage} alt="Profile" className="h-32 w-32 mx-auto rounded-xl object-cover" />
                                        <button
                                            onClick={() => handleDeleteImage("profile")}
                                            className="absolute top-0 right-1/2 translate-x-16 -translate-y-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                                            disabled={uploadingImage === "profile"}
                                        >
                                            ✕
                                        </button>
                                        {uploadingImage === "profile" && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-4 relative">
                                        <span className="text-3xl">📷</span>
                                        <p className="mt-2 text-xs text-neutral-500 font-medium">Click to upload image</p>
                                        {uploadingImage === "profile" && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-800/80 rounded-xl backdrop-blur-sm">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Invisible file input covering the whole box when empty, or below it when filled */}
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp, image/gif"
                                    onChange={(e) => handleImageUpload(e, "profile")}
                                    disabled={uploadingImage !== null}
                                    className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${profileImage ? 'pointer-events-none' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-300">
                                Cover Image
                            </label>
                            <div className="relative rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center dark:border-neutral-600">
                                {coverImage ? (
                                    <div className="relative">
                                        <img src={coverImage} alt="Cover" className="h-32 w-full rounded-xl object-cover" />
                                        <button
                                            onClick={() => handleDeleteImage("cover")}
                                            className="absolute top-0 right-0 -translate-y-2 translate-x-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                                            disabled={uploadingImage === "cover"}
                                        >
                                            ✕
                                        </button>
                                        {uploadingImage === "cover" && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-4 relative">
                                        <span className="text-3xl">🖼️</span>
                                        <p className="mt-2 text-xs text-neutral-500 font-medium">Click to upload image</p>
                                        {uploadingImage === "cover" && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-800/80 rounded-xl backdrop-blur-sm">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Invisible file input covering the whole box */}
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp, image/gif"
                                    onChange={(e) => handleImageUpload(e, "cover")}
                                    disabled={uploadingImage !== null}
                                    className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${coverImage ? 'pointer-events-none' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Basic Info ── */}
                <section className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Basic Info</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Kitchen Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Contact ── */}
                <section className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Contact Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+923001234567"
                                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-primary-500 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">WhatsApp</label>
                            <input
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="+923001234567"
                                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-primary-500 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Delivery Options ── */}
                <section className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">Delivery Options</h2>
                    <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">
                        Choose what delivery options you offer. Buyers will only see the options you select.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => toggleDelivery("SELF_PICKUP")}
                            className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${deliveryOptions.includes("SELF_PICKUP")
                                ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
                                }`}
                        >
                            🏃 Self Pickup
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleDelivery("FREE_DELIVERY")}
                            className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${deliveryOptions.includes("FREE_DELIVERY")
                                ? "bg-accent-500 text-white shadow-md shadow-accent-500/20"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
                                }`}
                        >
                            🛵 Free Delivery
                        </button>
                    </div>
                    {deliveryOptions.length === 0 && (
                        <p className="mt-2 text-xs text-red-500">Please select at least one delivery option</p>
                    )}
                </section>

                {/* ── Save Button ── */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || deliveryOptions.length === 0}
                        className="rounded-xl bg-primary-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-[0.97] disabled:opacity-60"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Saving...
                            </span>
                        ) : "Save Settings ✓"}
                    </button>
                </div>
            </div>
        </div>
    );
}
