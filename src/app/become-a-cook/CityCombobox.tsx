"use client";

import React, { useState, useEffect } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface CityComboboxProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

export function CityCombobox({ value, onChange, error }: CityComboboxProps) {
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/cities/available")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCities(data.data || []);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="relative">
            <input
                type="text"
                list="city-options"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-xl border ${
                    error ? "border-red-500" : "border-neutral-300 dark:border-neutral-600"
                } bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:text-neutral-200`}
                placeholder={loading ? "Loading cities..." : "Type or select a city..."}
                disabled={loading}
            />
            <datalist id="city-options">
                {cities.map((city) => (
                    <option key={city} value={city} />
                ))}
            </datalist>
        </div>
    );
}
