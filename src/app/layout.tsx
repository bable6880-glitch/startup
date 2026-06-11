import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";

export const metadata: Metadata = {
  metadataBase: new URL('https://smarttiffinfood.vercel.app'),
  title: {
    // Pages that already include "Smart Tiffin" in their title will NOT
    // get a duplicate suffix. Pages that don't include it will get "| Smart Tiffin".
    default: 'Smart Tiffin – Daily Tiffin Service in Pakistan',
    template: '%s',
  },
  description: 'Pakistan\'s home food marketplace. Fresh daily tiffin from trusted home cooks.',
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
  verification: {
    google: 'pc-7mt4zNiUbk0CsFxXoqMybykQ9ZbZH-GJpFgevx94',
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
        <meta name="google-site-verification" content="pc-7mt4zNiUbk0CsFxXoqMybykQ9ZbZH-GJpFgevx94" />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
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

