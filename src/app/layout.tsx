import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebsiteSchema, buildOrganizationSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  metadataBase: new URL('https://smarttiffinfood.vercel.app'),
  title: {
    default: 'Tiffin Service Lahore, Islamabad & Karachi | Homemade Food Delivery Pakistan | Smart Tiffin',
    template: '%s | Smart Tiffin',
  },
  description: 'Find trusted tiffin services, homemade food delivery, daily lunch plans, and monthly meal subscriptions in Lahore, Islamabad, Karachi, Rawalpindi, and across Pakistan.',
  keywords: [
    'tiffin service lahore',
    'homemade food delivery pakistan',
    'daily lunch delivery',
    'tiffin service islamabad',
    'tiffin service karachi',
    'ghar ka khana',
    'home cooked meals pakistan',
    'monthly meal plans',
    'lunch box service',
    'home chef pakistan',
  ],
  authors: [{ name: 'Smart Tiffin', url: 'https://smarttiffinfood.vercel.app' }],
  creator: 'Smart Tiffin',
  publisher: 'Smart Tiffin',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://smarttiffinfood.vercel.app',
    siteName: 'Smart Tiffin',
    title: 'Smart Tiffin | Pakistan\'s Homemade Food Marketplace',
    description: 'Discover trusted tiffin services and homemade food delivery across Pakistan.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Smart Tiffin - Homemade Food Delivery Pakistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Tiffin | Homemade Food Delivery Pakistan',
    description: 'Find tiffin services and homemade food delivery across Pakistan.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? 'pc-7mt4zNiUbk0CsFxXoqMybykQ9ZbZH-GJpFgevx94',
  },
};

export const viewport = {
  themeColor: '#ea580c',
};

import { LocationProvider } from "@/lib/location-context";

import { Inter, Montserrat } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat-var",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`}>
      <head>
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <JsonLd schema={buildWebsiteSchema()} />
        <JsonLd schema={buildOrganizationSchema()} />
        <AuthProvider>
          <CartProvider>
            <LocationProvider>
              <RootLayoutClient>{children}</RootLayoutClient>
            </LocationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

