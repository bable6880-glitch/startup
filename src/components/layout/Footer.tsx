import Link from "next/link";

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];

export default function Footer() {
    return (
        <footer className="border-t border-neutral-200 bg-white mt-auto dark:bg-neutral-900 dark:border-neutral-800">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl">🍱</span>
                            <span className="text-lg font-bold text-gradient">Smart Tiffin</span>
                        </Link>
                        <p className="mt-3 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                            Discover authentic home&dash;cooked meals from local kitchens in your city.
                            Fresh, affordable, and made with love.
                        </p>
                    </div>

                    {/* Cities */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Popular Cities</h3>
                        <ul className="mt-3 space-y-2">
                            {cities.map((city) => (
                                <li key={city}>
                                    <Link
                                        href={`/city/${city.toLowerCase()}`}
                                        className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400"
                                    >
                                        {city}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Cooks */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">For Cooks</h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/become-a-cook" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Become a Cook
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Cook Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/premium" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Premium Plans
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Company</h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/about" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/about#contact" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors dark:text-neutral-400 dark:hover:text-primary-400">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 border-t border-neutral-200 pt-6 text-center dark:border-neutral-800">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        © {new Date().getFullYear()} Smart Tiffin. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
