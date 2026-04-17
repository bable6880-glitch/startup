'use client'

import React, { useState, useEffect } from 'react'
import { useLocation } from '@/lib/location-context'

export function LocationBanner() {
  const { location, requestLocation } = useLocation()
  const [dismissed, setDismissed] = useState(false)

  // Auto-hide if location is no longer denied
  useEffect(() => {
    if (location.status === 'granted') {
      setDismissed(false)
    }
  }, [location.status])

  if (location.status !== 'denied' || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 bg-zinc-900 text-white rounded-lg p-3 shadow-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">📍</span>
        <span className="font-medium text-sm">Enable location for better results</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => requestLocation()}
          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-1.5 px-3 rounded whitespace-nowrap transition-colors"
        >
          Enable
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white p-1"
          aria-label="Dismiss banner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
