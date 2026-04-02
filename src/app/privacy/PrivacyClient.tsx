"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Database, Search, Share2, Server, UserCheck, Cookie, Baby, RefreshCw, Mail, ChevronLeft, ArrowLeft } from "lucide-react";

export default function PrivacyClient() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<number>(1);
    
    // Smooth scrolling to section
    const scrollToSection = (id: string, index: number) => {
        setActiveSection(index);
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    const sections = [
        {
            number: 1,
            id: "information-we-collect",
            icon: Database,
            title: "Information We Collect",
            content: (
                <>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-300">
                        We collect the following types of information when you interact with Smart Tiffin:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { name: "Account Details", desc: "Name, email, and phone number" },
                            { name: "Order History", desc: "Delivery address & past orders" },
                            { name: "Device Info", desc: "IP address and browser type" },
                            { name: "Location Data", desc: "City for filtering kitchens" },
                            { name: "Auth Data", desc: "Firebase Google sign-in tokens" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm mb-1">{item.name}</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </>
            ),
        },
        {
            number: 2,
            id: "how-we-use",
            icon: Search,
            title: "How We Use Your Information",
            content: (
                <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/30">
                    <ul className="space-y-4">
                        {[
                            "To connect you with verified home cooks in your local area",
                            "To process, manage, and track your active orders securely",
                            "To send timely notifications regarding your order status",
                            "To analyze and improve our platform functionality and services",
                            "To prevent fraudulent activities and ensure platform safety"
                        ].map((text, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 shrink-0 shadow-sm" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ),
        },
        {
            number: 3,
            id: "information-sharing",
            icon: Share2,
            title: "Information Sharing",
            content: (
                <div className="space-y-6">
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        We take your privacy seriously. We share your name and contact details with a cook <strong className="font-semibold text-neutral-900 dark:text-neutral-100">only</strong> when you actively place an order. We never sell your personal data to third parties.
                    </p>
                    
                    <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 uppercase tracking-wider">Trusted 3rd Party Integrations</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 text-center">
                                <span className="text-xl mb-2">🔥</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm">Firebase</span>
                                <span className="text-xs text-neutral-500 mt-1">Authentication</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 text-center">
                                <span className="text-xl mb-2">☁️</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm">Cloudinary</span>
                                <span className="text-xs text-neutral-500 mt-1">Image Storage</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 text-center">
                                <span className="text-xl mb-2">💳</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm">Stripe</span>
                                <span className="text-xs text-neutral-500 mt-1">Payments</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            number: 4,
            id: "data-storing",
            icon: Server,
            title: "Data Storage & Security",
            content: (
                <div className="bg-neutral-900 dark:bg-neutral-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <Server className="absolute top-0 right-0 w-48 h-48 text-neutral-800 -mt-10 -mr-10 opacity-50 pointer-events-none" />
                    <ul className="relative space-y-4 font-medium text-sm text-neutral-200">
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400 mt-0.5">✔</span>
                            <span>Stored on secure enterprise Postgres servers via Neon.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400 mt-0.5">✔</span>
                            <span>Protected by industry-standard HTTPS/SSL encryption.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400 mt-0.5">✔</span>
                            <span>Firebase token verification ensuring strict auth security.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400 mt-0.5">✔</span>
                            <span>Data is retained only as long as your account is active.</span>
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            number: 5,
            id: "your-rights",
            icon: UserCheck,
            title: "Your Rights",
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {[
                        { title: "Data Access", desc: "Access your personal data any time via account settings" },
                        { title: "Account Deletion", desc: "Request full deletion of your account and related data" },
                        { title: "Notification Opt-out", desc: "Opt out of notifications in your account preferences" },
                        { title: "Data Modification", desc: "Contact support immediately to correct any inaccuracies" }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 border-l-2 border-primary-400 dark:border-primary-600 pl-4 py-1">
                            <div>
                                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{item.title}</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            number: 6,
            id: "cookies",
            icon: Cookie,
            title: "Cookies",
            content: (
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                        <Cookie className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300"><strong className="text-neutral-900 dark:text-neutral-100 font-bold">Strictly Essential:</strong> We use essential cookies strictly for authenticating your sessions.</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300"><strong className="text-neutral-900 dark:text-neutral-100 font-bold">No Tracking:</strong> We deeply respect privacy; NO advertising or tracking cookies are utilized.</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300"><strong className="text-neutral-900 dark:text-neutral-100 font-bold">Local Cart:</strong> Non-sensitive cart data is stored strictly locally in your browser&apos;s localStorage.</p>
                    </div>
                </div>
            ),
        },
        {
            number: 7,
            id: "childrens-privacy",
            icon: Baby,
            title: "Children's Privacy",
            content: (
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                    Our platform is rigorously <strong>not intended</strong> for users under the age of 18. We do not knowingly collect, store, or process data from minors. Any accounts suspected of belonging to minors will be swiftly removed.
                </p>
            ),
        },
        {
            number: 8,
            id: "changes-to-policy",
            icon: RefreshCw,
            title: "Changes to This Policy",
            content: (
                <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <RefreshCw className="w-8 h-8 text-neutral-500 shrink-0" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        We may update this policy periodically to reflect operational modifications. We will proactively notify registered users of significant changes via email or direct platform notifications.
                    </p>
                </div>
            ),
        },
        {
            number: 9,
            id: "contact",
            icon: Mail,
            title: "Contact",
            content: (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Privacy Operations Team</h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">If you hold queries relating directly to privacy controls.</p>
                    </div>
                    <a
                        href="mailto:privacy@smarttiffin.pk"
                        className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors px-6 py-2.5 rounded-lg text-sm font-semibold shadow"
                    >
                        <Mail className="w-4 h-4" /> privacy@smarttiffin.pk
                    </a>
                </div>
            ),
        },
    ];

    // Intersection Observer to update active section in sidebar on scroll
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0,
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = sections.findIndex(sec => sec.id === entry.target.id);
                    if (index !== -1) setActiveSection(index + 1);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((sec) => {
            const element = document.getElementById(sec.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 pt-10 pb-20 overflow-hidden">
                <div className="absolute inset-0 max-w-5xl mx-auto">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                </div>
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-4">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            Last Updated: April 2026
                        </span>
                        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl dark:text-white mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            A completely transparent look into how we store, fetch, analyze and secure your data to provide a seamless marketplace experience.
                        </p>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    
                    {/* Sticky Sidebar (Table of Contents) */}
                    <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 px-2 uppercase tracking-wide text-xs text-neutral-500 dark:text-neutral-400">On this page</h3>
                            <nav className="space-y-1 relative">
                                {/* Animated Active Indicator Line */}
                                <div 
                                    className="absolute left-0 w-1 bg-primary-500 rounded-r-full transition-all duration-300 ease-in-out"
                                    style={{
                                        top: `${(activeSection - 1) * 44}px`,
                                        height: '40px'
                                    }}
                                />
                                {sections.map((section, index) => {
                                    const isActive = activeSection === index + 1;
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id, section.number)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-all duration-200 h-[40px]",
                                                isActive 
                                                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium ml-1" 
                                                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200"
                                            )}
                                        >
                                            <Icon className={cn("w-4 h-4 shrink-0 transition-transform", isActive ? "scale-110" : "")} />
                                            <span className="truncate">{section.title}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                        
                        <div className="mt-6">
                            <Link
                                href="/terms"
                                className="group flex items-center justify-between bg-neutral-900 dark:bg-white border border-neutral-900 dark:border-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <div className="h-8 w-8 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                                    <ChevronLeft className="w-4 h-4 text-white dark:text-neutral-900" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Also read</p>
                                    <p className="font-semibold text-white dark:text-neutral-900">Terms & Conditions</p>
                                </div>
                            </Link>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 w-full max-w-full">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-6 md:p-10 space-y-16">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <section key={section.id} id={section.id} className="scroll-mt-32">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/10 flex items-center justify-center border border-primary-200 dark:border-primary-800">
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                                    {section.number}. {section.title}
                                                </h2>
                                            </div>
                                            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:text-neutral-600 dark:prose-p:text-neutral-300 prose-ul:text-neutral-600 dark:prose-ul:text-neutral-300 pl-0 sm:pl-16">
                                                {section.content}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile Cross Navigation */}
                        <div className="mt-8 lg:hidden block">
                            <Link
                                href="/terms"
                                className="group flex items-center justify-between bg-neutral-900 dark:bg-white p-5 rounded-2xl shadow-lg"
                            >
                                <div className="h-10 w-10 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:-translate-x-2 transition-transform">
                                    <ChevronLeft className="w-5 h-5 text-white dark:text-neutral-900" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Continue reading</p>
                                    <p className="font-bold text-lg text-white dark:text-neutral-900">Terms & Conditions</p>
                                </div>
                            </Link>
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}
