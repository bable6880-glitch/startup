'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocation } from "@/lib/location-context"

type SearchBarProps = {
    initialCity?: string
    initialQuery?: string
    compact?: boolean
}

type Suggestion = {
    mealId: string
    mealName: string
    kitchenId: string
    kitchenName: string
    price: number
    distanceKm: number | null
    category: string
}

export default function SearchBar({ initialCity = "", initialQuery = "", compact = false }: SearchBarProps) {
    const [city, setCity] = useState(initialCity)
    const [query, setQuery] = useState(initialQuery)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { location } = useLocation()
    
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const abortRef = useRef<AbortController | undefined>(undefined)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"]

    const handleSearch = useCallback((overrideQuery?: string) => {
        const q = overrideQuery ?? query
        const params = new URLSearchParams()
        if (city) params.set("city", city)
        if (q) params.set("q", q)
        startTransition(() => {
            router.push(`/explore?${params.toString()}`)
            setShowDropdown(false)
        })
    }, [city, query, router])

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([])
            setShowDropdown(false)
            return
        }

        setLoading(true)
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        try {
            const params = new URLSearchParams({ q })
            if (location.status === 'granted') {
                params.set('lat', location.lat.toString())
                params.set('lng', location.lng.toString())
            }
            const res = await fetch(`/api/search/suggestions?${params}`, {
                signal: abortRef.current.signal
            })
            if (!res.ok) throw new Error('API Error')
            const data = await res.json()
            setSuggestions(data.data?.suggestions ?? [])
            setShowDropdown(true)
            setActiveIndex(-1)
        } catch (err: any) {
            if (err.name === 'AbortError') return
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [location])

    useEffect(() => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            if (query !== initialQuery || showDropdown) { // only fetch if user typed
                fetchSuggestions(query)
            }
        }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [query, fetchSuggestions, showDropdown, initialQuery])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) {
            if (e.key === "Enter") handleSearch()
            return
        }

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === "Enter") {
            e.preventDefault()
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                const item = suggestions[activeIndex]
                router.push(`/kitchen/${item.kitchenId}`)
                setShowDropdown(false)
            } else {
                handleSearch()
            }
        } else if (e.key === "Escape") {
            setShowDropdown(false)
        }
    }

    const getDistanceBadge = (dist: number | null) => {
        if (dist === null) return null
        if (dist < 1) return <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">{dist} km</span>
        if (dist <= 3) return <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{dist} km</span>
        return <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">{dist} km</span>
    }

    return (
        <div ref={wrapperRef} className={`flex flex-col sm:flex-row gap-2 ${compact ? "" : "max-w-2xl mx-auto"} relative`}>
            {/* City Select */}
            <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 ${compact ? "py-2.5" : "py-3"}`}
                aria-label="Select city"
            >
                <option value="">All Cities</option>
                {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            {/* Search Input Container */}
            <div className="relative flex-1">
                <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setShowDropdown(true)
                    }}
                    onFocus={() => { if (query.length >= 2) setShowDropdown(true) }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search kitchens, cuisines..."
                    className={`w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-10 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 dark:placeholder:text-neutral-500 ${compact ? "py-2.5" : "py-3"}`}
                    aria-label="Search kitchens"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                />
                
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Suggestions Dropdown */}
                {showDropdown && query.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 z-50 overflow-hidden" role="listbox">
                        {!loading && suggestions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                Try a different search
                            </div>
                        ) : (
                            <ul className="max-h-80 overflow-y-auto">
                                {suggestions.map((item, idx) => (
                                    <li 
                                        key={idx}
                                        id={`suggestion-${idx}`}
                                        role="option"
                                        aria-selected={activeIndex === idx}
                                        onClick={() => {
                                            router.push(`/kitchen/${item.kitchenId}`)
                                            setShowDropdown(false)
                                        }}
                                        className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${activeIndex === idx ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                                                🥢 {item.mealName}
                                            </span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                                {item.kitchenName}
                                            </span>
                                            {getDistanceBadge(item.distanceKm)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Search Button */}
            <button
                onClick={() => handleSearch()}
                disabled={isPending}
                className={`rounded-xl bg-primary-500 px-6 font-semibold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-60 ${compact ? "py-2.5 text-sm" : "py-3 text-sm"}`}
            >
                {isPending ? "..." : "Search"}
            </button>
        </div>
    )
}
