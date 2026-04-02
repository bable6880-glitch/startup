import Link from "next/link";
import { CheckCircle2, Search, Star, MessageCircle, MapPin, BadgeCheck, Utensils, Sparkles } from "lucide-react";

export default function ExploreSEO() {
    return (
        <article className="mt-20 pt-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-t-[3rem]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-20">
                
                {/* Intro Section */}
                <section className="text-center space-y-6">
                    <span className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        Pakistan&apos;s Largest Food Directory
                    </span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                        Explore Home Kitchens Across Pakistan <br className="hidden md:block" />
                        <span className="text-primary-500">Fresh Tiffin Service in Every City</span>
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                        Discover the best home cooks offering fresh tiffin service in your city. Compare menus, pricing, and real customer ratings before placing your order. Smart Tiffin connects you with trusted home kitchens in Lahore, Karachi, Islamabad, and Rawalpindi &mdash; all just a WhatsApp message away.
                    </p>
                    <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                        Whether you want daily lunch, weekly dinner, or a one-time family meal, our directory helps you find the perfect home cook near you. <span className="underline decoration-primary-300 decoration-2 underline-offset-4">No apps. No registration. No middleman fees.</span>
                    </p>
                </section>

                {/* How It Works */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary-500" /> Find the Best Home Food Near You &mdash; How It Works
                    </h3>
                    <p className="mb-8 text-neutral-600 dark:text-neutral-400">Smart Tiffin makes it easy to find home cooked meal delivery near you in under 2 minutes.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { step: "1", title: "Select Your City", desc: "Choose from Lahore, Karachi, Islamabad, or Rawalpindi. Each city page shows home cooks organized by neighborhood (e.g., DHA, Gulberg, Clifton).", icon: MapPin },
                            { step: "2", title: "Compare Kitchens", desc: "Browse profiles showing daily menus, prices, ratings, delivery areas, verified kitchen photos, and WhatsApp response times.", icon: Search },
                            { step: "3", title: "Read Real Reviews", desc: "See what other customers say about food quality and hygiene. Smart Tiffin requires proof of order before allowing a review.", icon: Star },
                            { step: "4", title: "Order via WhatsApp", desc: "Click the WhatsApp button to chat directly. Tell them your meal choice, delivery address, time, and custom dietary needs.", icon: MessageCircle },
                            { step: "5", title: "Enjoy Fresh Food", desc: "The cook prepares your meal fresh at home. Pay directly via Cash on Delivery or EasyPaisa/JazzCash.", icon: Utensils }
                        ].map((s, i) => (
                            <div key={i} className="relative bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl hover:border-primary-200 transition-colors">
                                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold shadow-md">
                                    {s.step}
                                </div>
                                <s.icon className="w-8 h-8 text-primary-500 mb-4" />
                                <h4 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2">{s.title}</h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison Table */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Why Choose Home-Cooked Food Over Restaurants?</h3>
                    <p className="mb-6 text-neutral-600 dark:text-neutral-400">More Pakistanis are switching from restaurants to home kitchens every month. Here is why:</p>
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200">
                                <tr>
                                    <th className="p-4 font-semibold w-1/4">Aspect</th>
                                    <th className="p-4 font-bold text-primary-600 dark:text-primary-400 w-2/4">Home-Cooked Food (Smart Tiffin)</th>
                                    <th className="p-4 font-semibold text-neutral-500 w-1/4">Restaurant Food</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                                {[
                                    ["Health", "Less oil, no MSG, fresh ingredients", "Often oily, processed, high sodium"],
                                    ["Price", "PKR 200-400 per meal", "PKR 600-1500+ per meal"],
                                    ["Portion size", "Generous (home style)", "Often small or standardized"],
                                    ["Customization", "Full control (tell cook directly)", "Limited to menu options"],
                                    ["Authenticity", "Real family recipes", "Commercial recipes"],
                                    ["Leftovers", "You can order extra for next day", "Expensive to order extra"],
                                    ["Support local", "Money goes to a home cook (often a mother or small earner)", "Money goes to a corporation"]
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">{row[0]}</td>
                                        <td className="p-4 text-primary-700 dark:text-primary-300 bg-primary-50/30 dark:bg-primary-900/5">{row[1]}</td>
                                        <td className="p-4 text-neutral-500 italic">{row[2]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-900">
                        <p className="text-orange-800 dark:text-orange-200 font-medium">
                            <strong>The bottom line:</strong> Home-cooked food is 40-60% cheaper and significantly healthier than restaurant food. You also get to support local home cooks in your community.
                        </p>
                    </div>
                </section>

                {/* Verified Badge Details */}
                <section className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-start gap-4">
                        <BadgeCheck className="w-12 h-12 text-blue-500 shrink-0" />
                        <div>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Verified Home Kitchens &mdash; What Does &quot;Verified&quot; Mean?</h3>
                            <p className="text-neutral-600 dark:text-neutral-300 mb-4">Smart Tiffin offers a Verified badge on select cook profiles. A verified home kitchen has completed:</p>
                            <ul className="space-y-2 mb-6">
                                {[
                                    { text: "CNIC verification – cook shares valid Pakistani ID" },
                                    { text: "Kitchen inspection – photos or video call showing clean cooking area" },
                                    { text: "Menu validation – prices and dishes match what is delivered" },
                                    { text: "Customer feedback check – no major complaints in first 10 orders" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item.text}
                                    </li>
                                ))}
                            </ul>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-100 dark:border-neutral-700">
                                <strong>Important:</strong> Verification is a one-time trust signal, not an ongoing food safety certification. Always use your judgment and order a trial meal first. All cooks – verified or not – have customer feedback visible.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Types of Kitchens */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-primary-500" /> Types of Home Kitchens You Will Find
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            {
                                num: "1", title: "Daily Tiffin Services",
                                offer: "Lunch, dinner, or both, Mon-Fri",
                                best: "Working professionals, students",
                                price: "PKR 200-350 per meal",
                                menu: "Roti, daal, sabzi, rice, salad"
                            },
                            {
                                num: "2", title: "Specialty Home Cooks",
                                offer: "Specific cuisine (BBQ, biryani, karahi)",
                                best: "Weekend family dinners, guests",
                                price: "PKR 500-1000 per dish",
                                menu: "Full mutton karahi with naan, raita, salad"
                            },
                            {
                                num: "3", title: "Diet / Health-Focused",
                                offer: "Low oil, low salt, keto, diabetic-friendly",
                                best: "Weight loss, medical conditions",
                                price: "PKR 300-500 per meal",
                                menu: "Grilled chicken, brown rice, steamed veg"
                            },
                            {
                                num: "4", title: "Occasional / Party Catering",
                                offer: "Large quantities for events (20-50 people)",
                                best: "Birthdays, office lunches",
                                price: "PKR 150-250 per person",
                                menu: "Biryani, haleem, kheer, salad"
                            }
                        ].map((t, i) => (
                            <div key={i} className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-primary-500 font-bold mb-1">Type {t.num}</div>
                                <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t.title}</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex flex-col"><span className="text-neutral-400 uppercase text-xs font-bold tracking-wider">What they offer</span> <span className="font-medium text-neutral-700 dark:text-neutral-200 mt-0.5">{t.offer}</span></li>
                                    <li className="flex flex-col"><span className="text-neutral-400 uppercase text-xs font-bold tracking-wider">Best for</span> <span className="font-medium text-neutral-700 dark:text-neutral-200 mt-0.5">{t.best}</span></li>
                                    <li className="flex flex-col"><span className="text-neutral-400 uppercase text-xs font-bold tracking-wider">Pricing</span> <span className="font-bold text-primary-600 dark:text-primary-400 mt-0.5">{t.price}</span></li>
                                    <li className="flex flex-col"><span className="text-neutral-400 uppercase text-xs font-bold tracking-wider">Example Menu</span> <span className="italic text-neutral-600 dark:text-neutral-400 mt-0.5">{t.menu}</span></li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pricing By City */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Home Cooked Food Prices by City</h3>
                    <p className="mb-6 text-neutral-600 dark:text-neutral-400">Smart Tiffin helps you compare prices across Pakistan. Below are real ranges from active home kitchens on our platform.</p>

                    <div className="space-y-8">
                        <div>
                            <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Lahore – Home Cooked Tiffin Prices</h4>
                            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                                <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 font-medium">
                                        <tr>
                                            <th className="p-3">Meal Type</th>
                                            <th className="p-3">DHA</th>
                                            <th className="p-3">Gulberg</th>
                                            <th className="p-3">Johar Town</th>
                                            <th className="p-3">Model Town</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <tr><td className="p-3 font-medium">Single meal</td><td className="p-3">PKR 220-280</td><td className="p-3">PKR 250-300</td><td className="p-3">PKR 200-260</td><td className="p-3">PKR 220-280</td></tr>
                                        <tr><td className="p-3 font-medium">Full day</td><td className="p-3">PKR 400-500</td><td className="p-3">PKR 450-550</td><td className="p-3">PKR 380-480</td><td className="p-3">PKR 400-500</td></tr>
                                        <tr><td className="p-3 font-medium">Weekly lunch</td><td className="p-3">PKR 1000-1200</td><td className="p-3">PKR 1100-1300</td><td className="p-3">PKR 900-1100</td><td className="p-3">PKR 1000-1200</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Karachi – Home Cooked Meal Delivery</h4>
                            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                                <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 font-medium">
                                        <tr>
                                            <th className="p-3">Meal Type</th>
                                            <th className="p-3">Clifton</th>
                                            <th className="p-3">DHA</th>
                                            <th className="p-3">Gulshan</th>
                                            <th className="p-3">North Nazimabad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <tr><td className="p-3 font-medium">Single meal</td><td className="p-3">PKR 250-300</td><td className="p-3">PKR 260-320</td><td className="p-3">PKR 220-280</td><td className="p-3">PKR 220-280</td></tr>
                                        <tr><td className="p-3 font-medium">Full day</td><td className="p-3">PKR 450-550</td><td className="p-3">PKR 480-580</td><td className="p-3">PKR 400-500</td><td className="p-3">PKR 400-500</td></tr>
                                        <tr><td className="p-3 font-medium">Weekly lunch</td><td className="p-3">PKR 1100-1300</td><td className="p-3">PKR 1200-1400</td><td className="p-3">PKR 1000-1200</td><td className="p-3">PKR 1000-1200</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Islamabad – Home Food Delivery</h4>
                            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                                <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 font-medium">
                                        <tr>
                                            <th className="p-3">Meal Type</th>
                                            <th className="p-3">F-10</th>
                                            <th className="p-3">G-11</th>
                                            <th className="p-3">I-8</th>
                                            <th className="p-3">E-7</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <tr><td className="p-3 font-medium">Single meal</td><td className="p-3">PKR 280-350</td><td className="p-3">PKR 260-320</td><td className="p-3">PKR 250-300</td><td className="p-3">PKR 300-380</td></tr>
                                        <tr><td className="p-3 font-medium">Full day</td><td className="p-3">PKR 500-600</td><td className="p-3">PKR 480-580</td><td className="p-3">PKR 450-550</td><td className="p-3">PKR 550-650</td></tr>
                                        <tr><td className="p-3 font-medium">Weekly lunch</td><td className="p-3">PKR 1200-1500</td><td className="p-3">PKR 1100-1400</td><td className="p-3">PKR 1100-1300</td><td className="p-3">PKR 1300-1600</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Rawalpindi – Tiffin Service</h4>
                            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                                <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 font-medium">
                                        <tr>
                                            <th className="p-3">Meal Type</th>
                                            <th className="p-3">Saddar</th>
                                            <th className="p-3">Westridge</th>
                                            <th className="p-3">Bahria Town</th>
                                            <th className="p-3">Gulrez</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <tr><td className="p-3 font-medium">Single meal</td><td className="p-3">PKR 200-260</td><td className="p-3">PKR 220-280</td><td className="p-3">PKR 250-320</td><td className="p-3">PKR 200-260</td></tr>
                                        <tr><td className="p-3 font-medium">Full day</td><td className="p-3">PKR 380-480</td><td className="p-3">PKR 400-500</td><td className="p-3">PKR 450-550</td><td className="p-3">PKR 380-480</td></tr>
                                        <tr><td className="p-3 font-medium">Weekly lunch</td><td className="p-3">PKR 900-1100</td><td className="p-3">PKR 950-1200</td><td className="p-3">PKR 1100-1300</td><td className="p-3">PKR 900-1100</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-4 italic text-center">Note: Prices may vary based on ingredients (chicken vs mutton), delivery distance, and seasonal availability. Always confirm final price on WhatsApp before ordering.</p>
                </section>

                {/* Popular Dishes */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Popular Dishes Available from Home Kitchens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl">
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">Daily Curries</h4>
                            <ul className="text-sm space-y-2 text-neutral-600 dark:text-neutral-400">
                                <li>🍲 Chicken Curry</li>
                                <li>🍲 Mutton Karahi</li>
                                <li>🍲 Aloo Keema</li>
                                <li>🍲 Daal Masoor / Chana</li>
                                <li>🍲 Bhindi / Palak</li>
                                <li>🍲 Karela / Baingan</li>
                            </ul>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl">
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">Rice Dishes</h4>
                            <ul className="text-sm space-y-2 text-neutral-600 dark:text-neutral-400">
                                <li>🍛 Chicken Biryani</li>
                                <li>🍛 Mutton Pulao</li>
                                <li>🍛 Vegetable Tehri</li>
                                <li>🍛 Kabuli Pulao</li>
                                <li>🍚 Steamed Rice</li>
                            </ul>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl">
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">Breads & Sides</h4>
                            <ul className="text-sm space-y-2 text-neutral-600 dark:text-neutral-400">
                                <li>🫓 Roti / Phulka</li>
                                <li>🫓 Tawa Paratha</li>
                                <li>🫓 Naan</li>
                                <li>🥗 Raita & Salad</li>
                                <li>🥭 Mixed Achar</li>
                            </ul>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl">
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">Weekend Specials</h4>
                            <ul className="text-sm space-y-2 text-neutral-600 dark:text-neutral-400">
                                <li>🍖 Haleem (Friday)</li>
                                <li>🍖 Nihari (Sunday)</li>
                                <li>🍖 Paye (Saturday)</li>
                                <li>🍖 Sajji (Roasted)</li>
                                <li>🍮 Zarda / Kunafa</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        {[
                            { q: "Are all cooks verified on Smart Tiffin?", a: "Not all cooks are verified, but all listings include customer feedback. Verified cooks have completed CNIC and kitchen inspection. We recommend ordering a trial meal perfectly from any new cook – verified or not – before committing to a weekly subscription." },
                            { q: "How do I order from a home kitchen?", a: "Simply click the WhatsApp button on any cook's profile. You will chat directly with the cook. Tell them your meal choice, delivery address, and time. They will confirm availability and price." },
                            { q: "Is home cooked food really cheaper than restaurants?", a: "Yes. A restaurant meal in Pakistan costs PKR 600-1500+. A home cooked meal on Smart Tiffin costs PKR 200-400 – that is 50-70% cheaper. You save money and eat healthier." },
                            { q: "Can I order for a full week (Monday to Friday)?", a: "Yes. Most home cooks offer weekly tiffin subscriptions. Contact the cook on WhatsApp and ask for their weekly plan. Subscriptions are usually 10-15% cheaper than daily orders." },
                            { q: "What if I have food allergies or strict dietary needs?", a: "Because you contact the cook directly on WhatsApp, you can easily customize your meal. For example: 'No onion or garlic', 'Less salt', or 'Gluten free'. Most home cooks are happy to adjust." },
                            { q: "How do I leave a review for a home cook?", a: "After receiving your order, visit the cook's profile. Click 'Leave a Review'. You will need to upload a screenshot of your WhatsApp chat with the cook as proof of order. This prevents fake reviews." },
                            { q: "What if the food is bad or the cook is unresponsive?", a: "First, message the cook on WhatsApp to resolve the issue. If the cook ignores you or repeatedly delivers poor quality, please email us at support@smarttiffin.pk with evidence. We will investigate and potentially remove them." },
                            { q: "Can I become a home cook on Smart Tiffin?", a: "Yes. Visit our Start Cooking Today page. Listing is free. You will need your kitchen location, sample menu with prices, photos, and CNIC copy for verification." },
                            { q: "Does Smart Tiffin charge commission?", a: "No. Smart Tiffin is a completely free directory. We never take a percentage of your order. You pay the cook directly to keep prices low." },
                            { q: "How fresh is the food?", a: "All home cooks prepare meals on the same day of delivery. Lunch orders are cooked in the morning. Dinner orders are cooked in the afternoon. No frozen or reheated food." },
                            { q: "How long does delivery take?", a: "Most home cooks deliver within 1-2 hours for lunch (12PM-2PM) and 1-2 hours for dinner (7PM-9PM window). Exact timing varies by cook." }
                        ].map((faq, i) => (
                            <details key={i} className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer text-lg font-medium text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                    {faq.q}
                                    <span className="transition duration-300 group-open:-rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="p-5 pt-0 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/20 leading-relaxed border-t border-neutral-100 dark:border-neutral-800">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 text-center text-white shadow-xl">
                    <h3 className="text-3xl font-extrabold mb-4">Ready to Explore Home Kitchens Near You?</h3>
                    <p className="text-primary-100 max-w-2xl mx-auto mb-8 text-lg">
                        Finding fresh, affordable, home-cooked food in Pakistan has never been easier. No apps. No registration. No middleman fees. Just good food made with love.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/explore?city=Lahore" className="bg-white/10 hover:bg-white/20 border border-white/30 transition-colors px-6 py-3 rounded-xl font-semibold">Lahore 🍲</Link>
                        <Link href="/explore?city=Karachi" className="bg-white/10 hover:bg-white/20 border border-white/30 transition-colors px-6 py-3 rounded-xl font-semibold">Karachi 🍲</Link>
                        <Link href="/explore?city=Islamabad" className="bg-white/10 hover:bg-white/20 border border-white/30 transition-colors px-6 py-3 rounded-xl font-semibold">Islamabad 🍲</Link>
                        <Link href="/explore?city=Rawalpindi" className="bg-white/10 hover:bg-white/20 border border-white/30 transition-colors px-6 py-3 rounded-xl font-semibold">Rawalpindi 🍲</Link>
                    </div>
                </section>

            </div>
        </article>
    );
}
