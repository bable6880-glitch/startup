import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Smart Tiffin – Home-Cooked Meals Near You",
    template: "%s | Smart Tiffin",
  },
  description:
    "Discover authentic home-cooked meals from local kitchens. Browse menus, check ratings, and contact cooks directly. Fresh, affordable, and made with love.",
  keywords: [
    "home food",
    "tiffin service",
    "home-cooked meals",
    "local kitchen",
    "food delivery",
    "homemade food",
  ],
  openGraph: {
    type: "website",
    siteName: "Smart Tiffin",
    title: "Smart Tiffin – Home-Cooked Meals Near You",
    description:
      "Discover authentic home-cooked meals from local kitchens in your city.",
  },
  verification: {
    google: "pc-7mt4zNiUbk0CsFxXoqMybykQ9ZbZH-GJpFgevx94",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

