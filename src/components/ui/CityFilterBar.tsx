'use client'

import React, { useEffect, useRef } from 'react'
import { PAKISTAN_CITIES } from '@/config/constants'
import { cn } from '@/lib/utils'

interface CityFilterBarProps {
  activeCity?: string
  onCityChange: (slug: string) => void
}

export function CityFilterBar({ activeCity = 'all', onCityChange }: CityFilterBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest' // not really needed for horizontal scroll, but safe
      })
    }
  }, [activeCity])

  return (
    <div className="relative w-full max-w-4xl mx-auto my-4">
      <div 
        ref={containerRef}
        className="flex flex-row overflow-x-auto gap-2 px-4 py-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PAKISTAN_CITIES.map((city) => {
          const isActive = activeCity === city.slug
          return (
            <button
              key={city.slug}
              ref={isActive ? activeRef : null}
              onClick={() => onCityChange(city.slug)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap snap-start',
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {city.name}
            </button>
          )
        })}
      </div>
      
      {/* Fade gradient on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none dark:from-neutral-900" />
      {/* Fade gradient on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none dark:from-neutral-900" />
    </div>
  )
}
