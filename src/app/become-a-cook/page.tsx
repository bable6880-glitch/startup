import { Metadata } from 'next'
import BecomeACookClient from './BecomeACookClient'

export const metadata: Metadata = {
  title: 'Become a Cook | Smart Tiffin',
  description: 'Register your kitchen and start selling home cooked food today.',
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app/become-a-cook',
  },
}

export default function BecomeACookPage() {
  return <BecomeACookClient />
}
