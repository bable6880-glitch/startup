"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const baseCities = [
    { name: "Lahore", emoji: "🏙️" },
    { name: "Karachi", emoji: "🌊" },
    { name: "Islamabad", emoji: "🏔️" },
    { name: "Rawalpindi", emoji: "🏢" },
    { name: "Faisalabad", emoji: "🏭" },
    { name: "Multan", emoji: "☀️" },
];

type CityCounts = Record<string, number>;

export default function CityCards() {
    const [cityCounts, setCityCounts] = useState<CityCounts | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (json?.data?.cityCounts) setCityCounts(json.data.cityCounts);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                    Browse by City
                </h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    Find home kitchens near you
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {baseCities.map((city) => {
                    const count = cityCounts?.[city.name] ?? 0;
                    return (
                        <Link
                            key={city.name}
                            href={`/city/${city.name.toLowerCase()}`}
                            className="group flex flex-col items-center rounded-2xl bg-white border border-neutral-200/60 p-6 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-primary-600"
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                {city.emoji}
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {city.name}
                            </span>
                            <span className="text-xs text-neutral-400 mt-1">
                                {loading ? (
                                    <span className="inline-block h-3 w-14 rounded bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                                ) : (
                                    `${count} ${count === 1 ? "kitchen" : "kitchens"}`
                                )}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
