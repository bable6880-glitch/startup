import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
    title: "Terms & Conditions | Smart Tiffin",
    description:
        "Read Smart Tiffin's terms and conditions for using Pakistan's home food marketplace platform.",
};

export default function TermsPage() {
    return <TermsClient />;
}
