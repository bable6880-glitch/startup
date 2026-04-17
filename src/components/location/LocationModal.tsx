'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocation } from '@/lib/location-context'

export function LocationModal() {
  const { location, requestLocation, skipLocation } = useLocation()
  const [showModal, setShowModal] = useState(false)
  const pathname = usePathname()

  const isExcludedPage = 
    pathname === '/login' || 
    pathname.startsWith('/seller') || 
    pathname.startsWith('/admin')

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (location.status === 'idle' && !isExcludedPage) {
      timeout = setTimeout(() => setShowModal(true), 1500)
    } else {
      setShowModal(false)
    }
    return () => clearTimeout(timeout)
  }, [location.status, isExcludedPage])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="text-6xl mb-4">📍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Find kitchens near you</h2>
        <p className="text-gray-600 mb-6 font-medium">
          Smart Tiffin uses your location to show home kitchens within 5km of you.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => requestLocation()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Allow Location
          </button>
          <button
            onClick={() => skipLocation()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Browse All Kitchens
          </button>
        </div>
      </div>
    </div>
  )
}
