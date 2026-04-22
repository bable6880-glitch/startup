import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Become a Cook | Smart Tiffin – Start Your Home Food Business",
    description: "Register your home kitchen on Smart Tiffin and start selling home-cooked meals online. No commission fees. Connect directly with customers in Lahore, Karachi & Islamabad.",
    alternates: {
        canonical: "https://smarttiffinfood.vercel.app/become-a-cook",
    },
    openGraph: {
        title: "Become a Cook | Smart Tiffin – Start Your Home Food Business",
        description: "Register your home kitchen on Smart Tiffin and start selling home-cooked meals online. No commission fees.",
        type: "website",
        url: "https://smarttiffinfood.vercel.app/become-a-cook",
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
