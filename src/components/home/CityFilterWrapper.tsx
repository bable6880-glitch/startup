'use client'

import { CityFilterBar } from '@/components/ui/CityFilterBar'
import { useRouter, useSearchParams } from 'next/navigation'

export function CityFilterWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCity = searchParams.get('city') ?? 'all'

  const handleCityChange = (slug: string) => {
    const params = new URLSearchParams(searchParams)
    if (slug === 'all') {
      params.delete('city')
    } else {
      params.set('city', slug)
    }
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  return <CityFilterBar activeCity={activeCity} onCityChange={handleCityChange} />
}
