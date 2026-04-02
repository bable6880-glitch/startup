"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContactCard } from "@/components/ui/contact-card";
import { Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* ── Feature cards data ─────────────────────────────────────────────── */

const features = [
    {
        icon: "🏠",
        title: "Real Home Kitchens",
        desc: "Meals prepared in actual homes, not commercial setups.",
    },
    {
        icon: "💰",
        title: "No Commission Model",
        desc: "Cooks keep 100% of their earnings.",
    },
    {
        icon: "📱",
        title: "Direct Ordering",
        desc: "No apps, no delays — connect instantly via WhatsApp.",
    },
    {
        icon: "⭐",
        title: "Verified Listings",
        desc: "Trusted cooks with real customer feedback.",
    },
    {
        icon: "🍛",
        title: "Authentic Pakistani Food",
        desc: "Daal, sabzi, karahi, biryani & more.",
    },
    {
        icon: "🌱",
        title: "Growing Community",
        desc: "Home cooks across Lahore, Karachi, Islamabad, Rawalpindi and beyond.",
    },
];

const values = [
    {
        icon: "🔍",
        title: "Transparency",
        desc: "No hidden fees, no surprises.",
    },
    {
        icon: "🤝",
        title: "Community",
        desc: "Supporting local home cooks first.",
    },
    {
        icon: "✅",
        title: "Quality",
        desc: "Every kitchen verified by our team.",
    },
];

/* ── Stats type ─────────────────────────────────────────────────────── */

type Stats = {
    kitchens: number;
    meals: number;
    customers: number;
};

function formatStat(n: number): string {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
    if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
    return String(n);
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function AboutClient() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (json?.data) setStats(json.data);
            })
            .catch(() => {})
            .finally(() => setStatsLoading(false));
    }, []);

    return (
        <div className="flex flex-col">
            {/* ── Back Button ───────────────────────────────────────── */}
            <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors mb-2"
                >
                    ← Back
                </button>
            </div>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/20" />
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-900/20" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="inline-block rounded-full bg-primary-100/80 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6 animate-fade-in dark:bg-primary-900/40 dark:text-primary-300">
                            🍱 Our Story
                        </span>

                        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl animate-slide-up dark:text-neutral-50">
                            About{" "}
                            <span className="text-gradient">Smart Tiffin</span>
                        </h1>

                        <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-slide-up dark:text-neutral-300" style={{ animationDelay: "0.1s" }}>
                            Pakistan&apos;s growing home food platform built on a simple belief: everyone deserves access to fresh, authentic ghar ka khana — even when they don&apos;t have time to cook.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Our Story ─────────────────────────────────────────── */}
            <section className="bg-white dark:bg-neutral-900">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="mx-auto max-w-3xl">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                                Our Story
                            </h2>
                        </div>
                        <div className="space-y-5 text-neutral-600 leading-relaxed text-lg dark:text-neutral-300">
                            <p>
                                Smart Tiffin started with a real problem. Busy professionals, students, and families struggled to find healthy, affordable daily meals. Restaurant food was expensive, oily, and often lacked the comfort of home-cooked dishes. At the same time, thousands of talented home cooks had no platform to showcase their skills or earn from their kitchens.
                            </p>
                            <p>
                                So we built Smart Tiffin — a simple, transparent platform where:
                            </p>
                            <ul className="space-y-3 ml-1">
                                <li className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-bold mt-0.5 dark:bg-primary-900/40 dark:text-primary-400">✓</span>
                                    <span>Customers can discover trusted home kitchens</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-bold mt-0.5 dark:bg-primary-900/40 dark:text-primary-400">✓</span>
                                    <span>Cooks can earn directly without commissions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-bold mt-0.5 dark:bg-primary-900/40 dark:text-primary-400">✓</span>
                                    <span>Both connect instantly via WhatsApp</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── What Makes Us Different ────────────────────────────── */}
            <section className="bg-neutral-50 dark:bg-neutral-900/80">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                            What Makes Us Different
                        </h2>
                        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                            Built with passion for home-cooked food
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="group rounded-2xl bg-white border border-neutral-200/60 p-6 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-primary-600"
                            >
                                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform origin-left">{f.icon}</span>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                    {f.title}
                                </h3>
                                <p className="mt-2 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Our Mission ───────────────────────────────────────── */}
            <section className="bg-white dark:bg-neutral-900">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50 mb-8">
                            Our Mission
                        </h2>

                        {/* Quote-style callout */}
                        <div className="relative rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200/60 p-8 sm:p-10 shadow-sm dark:from-primary-900/20 dark:to-accent-900/20 dark:border-primary-800/40">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-lg shadow-lg shadow-primary-500/30">
                                ❝
                            </div>
                            <blockquote className="text-lg sm:text-xl font-semibold text-neutral-800 leading-relaxed italic dark:text-neutral-200">
                                &ldquo;To make home-cooked food accessible to everyone and empower home cooks to earn with dignity.&rdquo;
                            </blockquote>
                        </div>

                        <p className="mt-8 text-neutral-600 leading-relaxed text-lg dark:text-neutral-300">
                            We aim to support thousands of home chefs across Pakistan, helping them build sustainable income from their passion.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Our Vision ────────────────────────────────────────── */}
            <section className="bg-neutral-50 dark:bg-neutral-900/80">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50 mb-6">
                            Our Vision
                        </h2>
                        <p className="text-neutral-600 leading-relaxed text-lg dark:text-neutral-300">
                            To become Pakistan&apos;s most trusted platform for daily home food delivery, where every meal feels like it came from your own kitchen.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Live Stats ────────────────────────────────────────── */}
            {(statsLoading || stats) && (
                <section className="bg-white dark:bg-neutral-900">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                                Smart Tiffin in Numbers
                            </h2>
                            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                                Growing every day
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
                            {statsLoading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-8 text-center shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                                            <div className="mx-auto h-10 w-20 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-700 mb-3" />
                                            <div className="mx-auto h-4 w-24 rounded bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                                        </div>
                                    ))}
                                </>
                            ) : stats ? (
                                <>
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-8 text-center shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700">
                                        <p className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-primary-400">{formatStat(stats.kitchens)}</p>
                                        <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Kitchens</p>
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-8 text-center shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700">
                                        <p className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-primary-400">{formatStat(stats.meals)}</p>
                                        <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Meals Available</p>
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-8 text-center shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700">
                                        <p className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-primary-400">{formatStat(stats.customers)}</p>
                                        <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Happy Customers</p>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Our Values ────────────────────────────────────────── */}
            <section className="bg-neutral-50 dark:bg-neutral-900/80">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                            Our Values
                        </h2>
                        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                            The principles that guide everything we do
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
                        {values.map((v, i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-white border border-neutral-200/60 p-6 text-center shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700"
                            >
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-2xl mb-4 dark:bg-primary-900/30">
                                    {v.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {v.title}
                                </h3>
                                <p className="mt-2 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                                    {v.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className="bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-center">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        Ready to Get Started?
                    </h2>
                    <p className="mt-3 text-primary-100 max-w-lg mx-auto">
                        Whether you&apos;re looking for delicious home-cooked meals or want to share your culinary talent — we&apos;ve got you covered.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/explore"
                            className="w-full sm:w-auto inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 shadow-lg hover:bg-primary-50 transition-all active:scale-95"
                        >
                            Explore Kitchens →
                        </Link>
                        <Link
                            href="/become-a-cook"
                            className="w-full sm:w-auto inline-block rounded-xl bg-primary-700 px-8 py-3 text-sm font-bold text-white shadow-lg border border-primary-400/30 hover:bg-primary-800 transition-all active:scale-95"
                        >
                            Become a Cook 🍳
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Contact ───────────────────────────────────────────── */}
            <section id="contact" className="bg-neutral-50 dark:bg-neutral-900/80">
                <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <ContactCard
                        title="Get in Touch"
                        description="Have questions or want to partner with us? Please fill out the form here. We do our best to respond within 1 business day."
                        contactInfo={[
                            {
                                icon: Mail,
                                label: "Email",
                                value: "support@smarttiffin.pk",
                            },
                            {
                                icon: Phone,
                                label: "Phone",
                                value: "+92 300 1234567",
                            },
                            {
                                icon: MapPin,
                                label: "Address",
                                value: "Lahore, Pakistan",
                            },
                        ]}
                    >
                        <form className="w-full space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" type="text" placeholder="John Doe" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="john@example.com" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" type="tel" placeholder="+92 300 1234567" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="How can we help you?" />
                            </div>
                            <Button className="w-full" type="button">
                                Submit
                            </Button>
                        </form>
                    </ContactCard>
                </div>
            </section>
        </div>
    );
}
