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

// ── Storage keys ──────────────────────────────────────────────────────────────
const LS_CACHE_KEY  = 'st_loc'         // localStorage — persists across sessions
const LS_DENIED_KEY = 'st_loc_denied'  // localStorage — persists the "skip" decision
const LS_GRANTED_KEY = 'st_loc_granted' // localStorage — "user already granted once"

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000  // 6 hours before re-requesting coords
const TIMEOUT_MS        = 8_000                 // 8 s GPS timeout

// ── Helpers ───────────────────────────────────────────────────────────────────
function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function lsRemove(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>({ status: 'idle' })

  const clearLocation = useCallback(() => {
    lsRemove(LS_CACHE_KEY)
    lsRemove(LS_DENIED_KEY)
    lsRemove(LS_GRANTED_KEY)
    setLocation({ status: 'idle' })
  }, [])

  // "Skip" — user dismissed; remember in localStorage so we NEVER ask again
  const skipLocation = useCallback(() => {
    lsSet(LS_DENIED_KEY, 'true')
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
            const cached: CachedLocation = { lat, lng, accuracy, ts }

            // ✅ Persist in localStorage so next visit doesn't prompt again
            lsSet(LS_CACHE_KEY,   JSON.stringify(cached))
            lsSet(LS_GRANTED_KEY, 'true')
            lsRemove(LS_DENIED_KEY)

            setLocation({ status: 'granted', lat, lng, accuracy })
            resolve()
          },
          (error) => {
            clearTimeout(timeoutId)
            if (error.code === error.PERMISSION_DENIED) {
              lsSet(LS_DENIED_KEY, 'true')
              setLocation({ status: 'denied' })
            } else {
              setLocation({ status: 'unavailable' })
            }
            resolve()
          },
          {
            enableHighAccuracy: false,
            timeout: TIMEOUT_MS,
            maximumAge: CACHE_DURATION_MS,
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
    const init = async () => {
      // 1. User previously skipped / denied → never ask again
      if (lsGet(LS_DENIED_KEY) === 'true') {
        setLocation({ status: 'denied' })
        return
      }

      // 2. Check cached coords (valid for 6 h)
      const raw = lsGet(LS_CACHE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as CachedLocation
          if (Date.now() - parsed.ts < CACHE_DURATION_MS) {
            // Cache still fresh — restore without prompting the user
            setLocation({ status: 'granted', lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy })
            return
          }
        } catch {
          lsRemove(LS_CACHE_KEY)
        }
      }

      // 3. User already granted before (browser remembers permission) → silently refresh
      if (lsGet(LS_GRANTED_KEY) === 'true') {
        // Use the Permissions API first if available (no prompt when already granted)
        if (typeof navigator.permissions !== 'undefined') {
          try {
            const perm = await navigator.permissions.query({ name: 'geolocation' })
            if (perm.state === 'granted') {
              // Browser already has permission — re-fetch silently, no popup
              requestLocation()
              return
            }
            if (perm.state === 'denied') {
              lsSet(LS_DENIED_KEY, 'true')
              setLocation({ status: 'denied' })
              return
            }
            // perm.state === 'prompt' — fall through to normal request below
          } catch {
            // Permissions API not supported, fall through
          }
        } else {
          // No Permissions API — just re-fetch (browser won't re-prompt if already allowed)
          requestLocation()
          return
        }
      }

      // 4. First-ever visit — stay idle; component that needs location will call requestLocation()
      // DO NOT call requestLocation() here — avoids auto-popup on every fresh visit
    }

    init()
  }, [requestLocation])

  return (
    <LocationContext.Provider
      value={{
        location,
        requestLocation,
        clearLocation,
        skipLocation,
        isLocationReady: location.status === 'granted',
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (ctx === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return ctx
}
