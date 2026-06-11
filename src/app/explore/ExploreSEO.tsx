import Link from "next/link";
import { CheckCircle2, Search, Star, MessageCircle, MapPin, BadgeCheck, Utensils, Sparkles } from "lucide-react";

export default function ExploreSEO() {
    return (
        <article className="mt-20 pt-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-t-[3rem]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-20">
                
                {/* 1. Intro Section */}
                <section className="text-center space-y-6">
                    <span className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        Smart Tiffin Explorer
                    </span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                        Welcome to Smart Tiffin Explorer
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                        Welcome to Smart Tiffin Explorer — your trusted place to discover homemade food delivery services, daily tiffin services, and affordable lunch box providers across Pakistan.
                    </p>
                    <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                        If you are searching for a reliable tiffin service in Lahore, Islamabad, Karachi, Rawalpindi, or any nearby area, this page helps you quickly find home cooks offering fresh, hygienic, and budget-friendly meals delivered daily to your home, office, or hostel.
                    </p>
                    <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                        Instead of spending time searching randomly for food options, Smart Tiffin Explorer brings all home tiffin services, monthly meal plans, and daily lunch delivery providers into one place so you can compare and choose easily.
                    </p>
                </section>

                {/* 2. Find Trusted Home Tiffin Services Near You */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Find Trusted Home Tiffin Services Near You</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Many people search online for phrases like:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>tiffin service near me</li>
                        <li>home tiffin service</li>
                        <li>daily tiffin service</li>
                        <li>lunch box delivery</li>
                        <li>mess services near me</li>
                        <li>ghar ka khana delivery</li>
                        <li>affordable lunch service</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">Smart Tiffin helps you connect with verified home cooks who prepare fresh meals daily and deliver them directly to customers.</p>
                    <p className="text-neutral-600 dark:text-neutral-400">Whether you are a student, office worker, or someone living away from home, you can easily find a home tiffin service near your location and enjoy healthy meals without the stress of cooking.</p>
                </section>

                {/* 3. Daily Lunch Delivery Services */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Daily Lunch Delivery Services</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">If you are tired of fast food and unhealthy restaurant meals, explore our daily lunch delivery services designed for convenience and nutrition.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Home cooks listed on Smart Tiffin prepare fresh meals every day, offering:</p>
                    <ul className="space-y-2 mb-6">
                        {[
                            "Fresh homemade lunch delivery",
                            "Traditional Pakistani meals",
                            "Balanced daily meal options",
                            "Affordable per-day pricing",
                            "Custom meal preferences",
                            "Hygienic kitchen preparation"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                            </li>
                        ))}
                    </ul>
                    <p className="mb-4 font-medium text-neutral-800 dark:text-neutral-200">Ideal for: Office employees, University students, Hostel residents, Freelancers and remote workers, Busy families.</p>
                    <p className="text-neutral-600 dark:text-neutral-400">Instead of wasting time on cooking or waiting for restaurant food, you can enjoy fresh homemade lunch delivered to your doorstep or workplace.</p>
                </section>

                {/* 4. Monthly Lunch Service & Meal Plans */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Monthly Lunch Service & Meal Plans</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">One of the most popular choices among users is the monthly lunch service.</p>
                    <p className="mb-6 text-neutral-600 dark:text-neutral-400">Monthly tiffin plans allow you to subscribe to a full month of homemade meals without ordering every day. This is the best option for people who want consistency, affordability, and convenience.</p>
                    
                    <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Benefits of Monthly Meal Plans</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {[
                            "Fixed monthly cost", "No daily ordering hassle", "Guaranteed meal delivery", 
                            "Custom meal schedules", "Reliable home cook service", "Budget-friendly pricing"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                            </div>
                        ))}
                    </div>

                    <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Popular packages</h4>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>20-day lunch plans</li>
                        <li>26-day meal subscriptions</li>
                        <li>Lunch + dinner packages</li>
                        <li>Student meal bundles</li>
                        <li>Office lunch subscriptions</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">If you are searching for monthly lunch service in Lahore or Islamabad, this platform helps you compare options easily.</p>
                </section>

                {/* 5. Tiffin Service in Lahore */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Tiffin Service in Lahore</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Lahore has one of the highest demands for homemade food and tiffin services in Pakistan. Students, bachelors, and office workers frequently search for tiffin service Lahore and daily fresh tiffin service Lahore to find affordable and reliable meals.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">On Smart Tiffin, you can explore home cooks offering services in areas such as:</p>
                    <ul className="grid grid-cols-2 gap-2 mb-6 text-neutral-700 dark:text-neutral-300">
                        {["DHA Lahore", "Gulberg", "Johar Town", "Model Town", "Bahria Town Lahore", "Wapda Town", "Township", "Allama Iqbal Town"].map((area, i) => (
                            <li key={i} className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> {area}</li>
                        ))}
                    </ul>
                    <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Services available</h4>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>Daily tiffin service Lahore</li>
                        <li>Monthly lunch service Lahore</li>
                        <li>Affordable home tiffin Lahore</li>
                        <li>Lunch box delivery Lahore</li>
                        <li>Student mess services Lahore</li>
                        <li>Ghar ka khana delivery Lahore</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">Whether you are searching for &quot;tiffin service in Lahore&quot; or &quot;best homemade food service in Lahore&quot;, Smart Tiffin helps you discover trusted home cooks nearby.</p>
                </section>

                {/* 6. Tiffin Service in Islamabad & Rawalpindi */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Tiffin Service in Islamabad & Rawalpindi</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Islamabad and Rawalpindi also have a large number of students and working professionals who depend on daily homemade food delivery services.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Smart Tiffin helps you find:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>Tiffin service Islamabad</li>
                        <li>Daily lunch delivery Islamabad</li>
                        <li>Home tiffin Rawalpindi</li>
                        <li>Monthly food plans Islamabad</li>
                        <li>Affordable ghar ka khana Islamabad</li>
                    </ul>
                    <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Popular areas</h4>
                    <ul className="grid grid-cols-2 gap-2 mb-6 text-neutral-700 dark:text-neutral-300">
                        {["G-13, G-11, G-10", "F-10, F-11, F-7", "I-8, I-10, I-14", "Bahria Town", "DHA Islamabad"].map((area, i) => (
                            <li key={i} className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> {area}</li>
                        ))}
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">If you are searching for a tiffin service near me in Islamabad, Smart Tiffin connects you with local home cooks offering fresh and hygienic meals every day.</p>
                </section>

                {/* 7. Affordable Homemade Food for Students */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Affordable Homemade Food for Students</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Students are one of the biggest users of tiffin services in Pakistan. Living away from home often makes it difficult to maintain a healthy diet.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Smart Tiffin provides access to budget-friendly student meal plans that include:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>Daily lunch and dinner</li>
                        <li>Monthly student packages</li>
                        <li>Cheap homemade food options</li>
                        <li>Hostel meal delivery</li>
                        <li>Mess-style services</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">Instead of eating fast food or skipping meals, students can enjoy affordable ghar ka khana delivered daily.</p>
                </section>

                {/* 8. Why Choose Homemade Tiffin Services? */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Why Choose Homemade Tiffin Services?</h3>
                    <p className="mb-6 text-neutral-600 dark:text-neutral-400">Homemade food is becoming more popular because it is healthier, affordable, and more satisfying than restaurant food.</p>
                    
                    <h4 className="text-lg font-bold text-primary-600 mb-3 ml-2 border-l-4 border-primary-500 pl-3">Advantages of homemade tiffin services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {[
                            "Freshly cooked meals every day",
                            "Better hygiene and quality control",
                            "Traditional Pakistani taste",
                            "Lower cost compared to restaurants",
                            "Healthier cooking methods",
                            "Customizable meal options"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                            </div>
                        ))}
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400">Smart Tiffin ensures you can easily access trusted home cooks who prepare quality meals with care.</p>
                </section>

                {/* 9. Mess Services & Home Cooks */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Mess Services & Home Cooks</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Many users also search for mess services in Pakistan. Smart Tiffin works as a modern digital alternative to traditional mess systems by connecting users with home-based food providers.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">You can find:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>Home mess services</li>
                        <li>Student mess food providers</li>
                        <li>Office lunch mess options</li>
                        <li>Daily meal subscription cooks</li>
                        <li>Small home kitchen businesses</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">This helps support local home cooks while giving customers more flexible and affordable food options.</p>
                </section>

                {/* 10. Lunch Box & Food Delivery Services */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Lunch Box & Food Delivery Services</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">If you are specifically looking for lunch box service or tiffin box delivery, Smart Tiffin provides multiple options from local home kitchens.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">You can explore:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>Packed lunch box delivery</li>
                        <li>Office lunch boxes</li>
                        <li>Homemade food containers</li>
                        <li>Weekly lunch box plans</li>
                        <li>Fresh daily meal boxes</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">These services are ideal for people who want ready-to-eat meals without cooking or waiting.</p>
                </section>

                {/* 11. Find Tiffin Service Near You */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Find Tiffin Service Near You</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Users often search:</p>
                    <ul className="space-y-2 mb-6 ml-4 list-disc list-outside text-neutral-700 dark:text-neutral-300">
                        <li>tiffin service near me</li>
                        <li>home tiffin near me</li>
                        <li>food delivery near me</li>
                        <li>lunch service near me</li>
                        <li>daily meal delivery near me</li>
                    </ul>
                    <p className="text-neutral-600 dark:text-neutral-400">Smart Tiffin helps you discover nearby home cooks based on your location so you can easily connect and order fresh homemade food.</p>
                </section>

                {/* 12. How Smart Tiffin Works */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary-500" /> How Smart Tiffin Works
                    </h3>
                    <p className="mb-8 text-neutral-600 dark:text-neutral-400">Using Smart Tiffin is simple:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { step: "1", title: "Browse Home Cooks", desc: "Explore available cooks and food providers in your city.", icon: Search },
                            { step: "2", title: "Compare Meal Plans", desc: "Check menus, pricing, and delivery options.", icon: Utensils },
                            { step: "3", title: "Contact via WhatsApp", desc: "Directly message the cook to place your order.", icon: MessageCircle },
                            { step: "4", title: "Enjoy Fresh Food", desc: "Receive fresh homemade meals at your doorstep.", icon: Star }
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
                    <p className="mt-8 text-neutral-600 dark:text-neutral-400">This direct system ensures fast communication, no middle charges, and better customer-cook relationships.</p>
                </section>

                {/* 13. Our Mission */}
                <section>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Our Mission</h3>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">Our mission is to make homemade food accessible and affordable across Pakistan.</p>
                    <p className="mb-4 text-neutral-600 dark:text-neutral-400">We aim to:</p>
                    <ul className="space-y-2 mb-6">
                        {[
                            "Support local home cooks",
                            "Promote healthy eating habits",
                            "Provide affordable meal options",
                            "Connect customers with trusted kitchens",
                            "Simplify food discovery through technology"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 14. Start Exploring Homemade Food Today (CTA) */}
                <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 text-center text-white shadow-xl">
                    <h3 className="text-3xl font-extrabold mb-4">Start Exploring Homemade Food Today</h3>
                    <p className="text-primary-100 max-w-2xl mx-auto mb-8 text-lg">
                        Whether you are searching for:
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {[
                            "Tiffin service in Lahore",
                            "Tiffin service in Islamabad",
                            "Daily lunch delivery",
                            "Monthly meal plans",
                            "Home tiffin service",
                            "Affordable ghar ka khana",
                            "Lunch box delivery",
                            "Mess services"
                        ].map((item, i) => (
                            <span key={i} className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium">{item}</span>
                        ))}
                    </div>
                    <p className="text-primary-100 max-w-2xl mx-auto mb-8 text-lg">
                        Smart Tiffin Explorer helps you find everything in one place. Browse available cooks now and enjoy fresh homemade food delivered daily anywhere in Pakistan.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/explore?city=Lahore" className="bg-white hover:bg-neutral-50 text-primary-700 transition-colors px-6 py-3 rounded-xl font-bold shadow-lg">Lahore</Link>
                        <Link href="/explore?city=Karachi" className="bg-white hover:bg-neutral-50 text-primary-700 transition-colors px-6 py-3 rounded-xl font-bold shadow-lg">Karachi</Link>
                        <Link href="/explore?city=Islamabad" className="bg-white hover:bg-neutral-50 text-primary-700 transition-colors px-6 py-3 rounded-xl font-bold shadow-lg">Islamabad</Link>
                        <Link href="/explore?city=Rawalpindi" className="bg-white hover:bg-neutral-50 text-primary-700 transition-colors px-6 py-3 rounded-xl font-bold shadow-lg">Rawalpindi</Link>
                    </div>
                </section>

            </div>
        </article>
    );
}
