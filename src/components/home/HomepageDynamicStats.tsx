"use client";

import { useEffect, useState } from "react";

type PlatformStats = {
    kitchens: number;
    meals: number;
    customers: number;
    orders: number;
    reviews: number;
    cities: number;
};

function formatStat(n: number): string {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
    if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
    return String(n);
}

export default function HomepageDynamicStats() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (json?.data) setStats(json.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const items = stats
        ? [
              { value: formatStat(stats.kitchens), label: "Active Kitchens" },
              { value: formatStat(stats.customers), label: "Happy Customers" },
              { value: `${stats.cities}`, label: "Cities" },
              { value: formatStat(stats.meals), label: "Meals Available" },
          ]
        : null;

    return (
        <div
            className="mt-10 flex flex-wrap justify-center gap-8 text-center animate-fade-in"
            style={{ animationDelay: "0.3s" }}
        >
            {loading ? (
                <>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[80px]">
                            <div className="mx-auto h-7 w-16 rounded-lg bg-primary-200/50 animate-pulse dark:bg-primary-800/30 mb-1" />
                            <div className="mx-auto h-4 w-20 rounded bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                        </div>
                    ))}
                </>
            ) : items ? (
                items.map((item) => (
                    <div key={item.label}>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {item.value}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {item.label}
                        </p>
                    </div>
                ))
            ) : null}
        </div>
    );
}
