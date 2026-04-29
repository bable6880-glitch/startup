import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
    title: "Privacy Policy | Smart Tiffin",
    description:
        "Learn how Smart Tiffin collects, uses and protects your personal data.",
    alternates: {
        canonical: 'https://smarttiffinfood.vercel.app/privacy',
    },
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
