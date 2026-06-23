import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
    title: "About Smart Tiffin | Pakistan's Homemade Food Marketplace",
    description: "Learn about Smart Tiffin, Pakistan's marketplace for homemade food. Discover our mission to connect local home chefs with customers seeking fresh, healthy, and affordable home-cooked meals.",
    alternates: {
        canonical: 'https://smarttiffinfood.vercel.app/about',
    },
    openGraph: {
        title: "About Smart Tiffin | Pakistan's Homemade Food Marketplace",
        description: "Learn about Smart Tiffin, Pakistan's marketplace for homemade food.",
        type: "website",
        url: "https://smarttiffinfood.vercel.app/about",
    }
};

export default function AboutPage() {
    return <AboutClient />;
}
