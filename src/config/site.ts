export const SITE_CONFIG = {
  url: 'https://smarttiffinfood.vercel.app',
  name: 'Smart Tiffin',
  description: "Pakistan's home food marketplace",
} as const

// Never trailing slash — canonical consistency
export const BASE_URL = 'https://smarttiffinfood.vercel.app'

// Cities for sitemap — all cities we support
export const SITEMAP_CITIES = [
  'lahore',
  'karachi',
  'islamabad',
  'rawalpindi',
  'faisalabad',
  'multan',
  'peshawar',
  'sialkot',
  'gujranwala',
] as const
