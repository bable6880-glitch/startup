import { Metadata } from 'next'
import BecomeACookClient from './BecomeACookClient'

export const metadata: Metadata = {
  title: 'Become a Home Cook in Pakistan | Sell Homemade Food Online | Smart Tiffin',
  description: 'Start earning by selling homemade food online with Smart Tiffin. Join Pakistan\'s growing home kitchen marketplace, reach more customers, and grow your home food business.',
  keywords: ['become a home cook', 'sell homemade food online', 'earn money cooking from home', 'home chef pakistan', 'home kitchen business pakistan', 'sell tiffin online'],
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app/become-a-cook',
  },
}

export default function BecomeACookPage() {
  return <BecomeACookClient />
}
