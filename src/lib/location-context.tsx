'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lng: number; accuracy: number; city?: string }
  | { status: 'denied' }
  | { status: 'unavailable' }

interface CachedLocation {
  lat: number
  lng: number
  accuracy: number
  ts: number
}

interface LocationContextType {
  location: LocationState
  requestLocation: () => Promise<void>
  clearLocation: () => void
  skipLocation: () => void
  isLocationReady: boolean
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

const CACHE_KEY = 'st_loc'
const DENIED_KEY = 'st_loc_denied'
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const TIMEOUT_MS = 8000 // 8 seconds

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>({ status: 'idle' })

  const clearLocation = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY)
    sessionStorage.removeItem(DENIED_KEY)
    setLocation({ status: 'idle' })
  }, [])

  const skipLocation = useCallback(() => {
    sessionStorage.setItem(DENIED_KEY, 'true')
    setLocation({ status: 'unavailable' })
  }, [])

  const requestLocation = useCallback(async () => {
    setLocation({ status: 'requesting' })
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocation({ status: 'unavailable' })
      return
    }

    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        setLocation({ status: 'unavailable' })
        resolve()
      }, TIMEOUT_MS)

      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            const { latitude: lat, longitude: lng, accuracy } = position.coords
            const ts = Date.now()
            const cachedLocation: CachedLocation = { lat, lng, accuracy, ts }
            
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachedLocation))
            sessionStorage.removeItem(DENIED_KEY)
            
            setLocation({ status: 'granted', lat, lng, accuracy })
            resolve()
          },
          (error) => {
            clearTimeout(timeoutId)
            if (error.code === error.PERMISSION_DENIED) {
              sessionStorage.setItem(DENIED_KEY, 'true')
              setLocation({ status: 'denied' })
            } else {
              setLocation({ status: 'unavailable' })
            }
            resolve()
          },
          {
            enableHighAccuracy: false,
            timeout: TIMEOUT_MS,
            maximumAge: CACHE_DURATION_MS
          }
        )
      } catch (e) {
        clearTimeout(timeoutId)
        setLocation({ status: 'unavailable' })
        resolve()
      }
    })
  }, [])

  useEffect(() => {
    const initLocation = () => {
      const isDenied = sessionStorage.getItem(DENIED_KEY)
      if (isDenied === 'true') {
        setLocation({ status: 'denied' })
        return
      }

      const cachedData = sessionStorage.getItem(CACHE_KEY)
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData) as CachedLocation
          if (Date.now() - parsed.ts < CACHE_DURATION_MS) {
            setLocation({
              status: 'granted',
              lat: parsed.lat,
              lng: parsed.lng,
              accuracy: parsed.accuracy
            })
            return
          } else {
            // Expired, requesting silently
            requestLocation()
          }
        } catch (e) {
          // Parse error, clear it
          sessionStorage.removeItem(CACHE_KEY)
        }
      }
    }

    initLocation()
  }, [requestLocation])

  return (
    <LocationContext.Provider
      value={{
        location,
        requestLocation,
        clearLocation,
        skipLocation,
        isLocationReady: location.status === 'granted'
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
