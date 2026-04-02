import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
    title: "About Us | Smart Tiffin",
    description:
        "Learn about Smart Tiffin — Pakistan's home food platform connecting customers with real home cooks.",
};

export default function AboutPage() {
    return <AboutClient />;
}
