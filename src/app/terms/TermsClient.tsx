"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldCheck, UserCheck, CreditCard, Star, AlertTriangle, Settings, FileText, Mail, ChevronRight, ArrowLeft } from "lucide-react";

export const termsSections = [
        {
            number: 1,
            id: "nature-of-service",
            icon: ShieldCheck,
            title: "Nature of Service",
            content: (
                <>
                    <p className="mb-4">
                        Smart Tiffin is a discovery platform that connects customers with independent home cooks. We do not:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {[
                            "Cook or prepare food",
                            "Handle delivery logistics",
                            "Process payments",
                            "Act as a food provider",
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <div className="h-6 w-6 rounded flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-xl p-4 text-primary-800 dark:text-primary-300 text-sm flex gap-3">
                        <div className="shrink-0 mt-0.5"><ShieldCheck className="w-5 h-5 text-primary-600" /></div>
                        <p>All transactions occur directly between the customer and the cook. We solely provide the platform for discovery and communication.</p>
                    </div>
                </>
            ),
        },
        {
            number: 2,
            id: "user-responsibilities",
            icon: UserCheck,
            title: "User Responsibilities",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
                            <UserCheck className="w-3.5 h-3.5" /> For Customers
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">You are responsible for verifying food quality, hygiene, and ingredients before ordering.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">All payments are made directly to the cook.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">Any disputes must be resolved with the cook.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> For Home Cooks
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">You must provide accurate menu, pricing, and contact details.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">You are responsible for food quality, hygiene, and safety.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary-500 mt-1">•</span>
                                <span className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">Any legal or local permits required are your responsibility.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            ),
        },
        {
            number: 3,
            id: "orders-payments",
            icon: CreditCard,
            title: "Orders & Payments",
            content: (
                <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
                    <ul className="space-y-4">
                        {[
                            { title: "Direct Communication", desc: "Orders are placed via WhatsApp or direct communication." },
                            { title: "Zero Commission", desc: "Smart Tiffin does not charge commission (subject to change)." },
                            { title: "Flexible Payments", desc: "Payment methods are agreed between customer and cook." }
                        ].map((item, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">{item.title}</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ),
        },
        {
            number: 4,
            id: "reviews-ratings",
            icon: Star,
            title: "Reviews & Ratings",
            content: (
                <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
                    <p className="leading-relaxed">To maintain a trustworthy community, all feedback must be authentic.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 bg-white dark:bg-neutral-900 border-l-4 border-emerald-500 p-4 shadow-sm rounded-r-lg">
                            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Genuine Reviews</h4>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Reviews must be genuine and based on real completed orders.</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-neutral-900 border-l-4 border-red-500 p-4 shadow-sm rounded-r-lg">
                            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Strict Moderation</h4>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Fake or misleading reviews may result in your account&apos;s removal.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            number: 5,
            id: "limitation-of-liability",
            icon: AlertTriangle,
            title: "Limitation of Liability",
            content: (
                <div className="p-5 bg-neutral-900 dark:bg-neutral-950 rounded-2xl text-white shadow-xl relative overflow-hidden">
                    <AlertTriangle className="absolute -right-6 -bottom-6 w-32 h-32 text-neutral-800 opacity-50 pointer-events-none" />
                    <p className="relative font-medium text-neutral-200 mb-4">Smart Tiffin is not liable for:</p>
                    <div className="relative grid grid-cols-2 gap-3">
                        {[
                            "Food quality issues",
                            "Delivery delays",
                            "Health-related concerns",
                            "Payment disputes"
                        ].map((issue, i) => (
                            <div key={i} className="bg-neutral-800/80 px-4 py-2 rounded-lg text-sm text-neutral-300 font-medium">
                                {issue}
                            </div>
                        ))}
                    </div>
                    <p className="relative mt-6 text-sm text-neutral-400 italic">Please use the platform at your own discretion. Evaluate cooks critically based on reviews and badges.</p>
                </div>
            ),
        },
        {
            number: 6,
            id: "account-usage",
            icon: Settings,
            title: "Account & Usage",
            content: (
                <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0 font-bold text-xs mt-0.5">18+</div>
                        <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Age Requirement</p>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">Users must be at least 18 years old to create an account and place orders.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0 font-bold text-xs mt-0.5">!!!</div>
                        <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">Platform Integrity</p>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">Misuse of the platform, including abusive behavior to cooks, may result in permanent restriction or removal.</p>
                        </div>
                    </li>
                </ul>
            ),
        },
        {
            number: 7,
            id: "changes-to-terms",
            icon: FileText,
            title: "Changes to Terms",
            content: (
                <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                        We may update these terms at any time. Continued use of the platform after updates are made means you accept and agree strictly to the new provisions.
                    </p>
                </div>
            ),
        },
        {
            number: 8,
            id: "contact",
            icon: Mail,
            title: "Contact",
            content: (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Legal or Support Queries</h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Reach out to our dedicated support team directly.</p>
                    </div>
                    <a
                        href="mailto:legal@smarttiffin.pk"
                        className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors px-6 py-2.5 rounded-lg text-sm font-semibold shadow"
                    >
                        <Mail className="w-4 h-4" /> legal@smarttiffin.pk
                    </a>
                </div>
            ),
        },
    ];

export default function TermsClient() {
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
                    const index = termsSections.findIndex(sec => sec.id === entry.target.id);
                    if (index !== -1) setActiveSection(index + 1);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        termsSections.forEach((sec) => {
            const element = document.getElementById(sec.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 pt-10 pb-20 overflow-hidden">
                <div className="absolute inset-0 max-w-5xl mx-auto">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
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
                            Terms & Conditions
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Please read these terms carefully. By accessing or using Smart Tiffin&apos;s marketplace, you agree to be bound by the following conditions.
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
                                {termsSections.map((section, index) => {
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
                                href="/privacy"
                                className="group flex items-center justify-between bg-neutral-900 dark:bg-white border border-neutral-900 dark:border-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Also read</p>
                                    <p className="font-semibold text-white dark:text-neutral-900">Privacy Policy</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <ChevronRight className="w-4 h-4 text-white dark:text-neutral-900" />
                                </div>
                            </Link>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 w-full max-w-full">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-6 md:p-10 space-y-16">
                                {termsSections.map((section) => {
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
                                href="/privacy"
                                className="group flex items-center justify-between bg-neutral-900 dark:bg-white p-5 rounded-2xl shadow-lg"
                            >
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Continue reading</p>
                                    <p className="font-bold text-lg text-white dark:text-neutral-900">Privacy Policy</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                    <ChevronRight className="w-5 h-5 text-white dark:text-neutral-900" />
                                </div>
                            </Link>
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}
