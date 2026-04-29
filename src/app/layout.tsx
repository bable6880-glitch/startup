import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://smarttiffinfood.vercel.app'),
  title: {
    default: 'Smart Tiffin – Daily Tiffin Service in Pakistan',
    template: '%s | Smart Tiffin',
  },
  description: 'Pakistan\'s home food marketplace. Fresh daily tiffin from trusted home cooks.',
  manifest: '/manifest.json',
  verification: {
    google: 'REPLACE_WITH_YOUR_CODE',
  },
};

export const viewport = {
  themeColor: '#ea580c',
};

import { LocationProvider } from "@/lib/location-context";
import { LocationModal } from "@/components/location/LocationModal";
import { LocationBanner } from "@/components/location/LocationBanner";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <LocationProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <LocationModal />
              <LocationBanner />
            </LocationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

