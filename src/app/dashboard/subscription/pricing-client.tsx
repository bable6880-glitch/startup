'use client';

import React from 'react';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PricingClient({ plans }: { plans: any[] }) {
    const { data, loading } = usePlanAccess();
    const router = useRouter();
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    const handleCheckout = async (planId: string) => {
        setCheckoutLoading(planId);
        try {
            const res = await fetch('/api/seller/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            const body = await res.json();
            if (body.checkoutUrl) {
                window.location.href = body.checkoutUrl;
            } else {
                alert(body.error || 'Failed to start checkout');
                setCheckoutLoading(null);
            }
        } catch (e) {
            alert('Network error');
            setCheckoutLoading(null);
        }
    };

    const PLAN_ORDER = ['starter', 'growth', 'pro', 'elite'];
    const currentIdx = PLAN_ORDER.indexOf(data?.planId as string);

    return (
        <div className="space-y-12">
            {/* PLAN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map(plan => {
                    const idx = PLAN_ORDER.indexOf(plan.planId);
                    const isCurrent = data?.planId === plan.planId;
                    const isDowngrade = currentIdx !== -1 && idx < currentIdx;

                    const bgColors: Record<string, string> = {
                        starter: 'bg-gray-600',
                        growth: 'bg-orange-500',
                        pro: 'bg-blue-600',
                        elite: 'bg-gradient-to-br from-purple-700 to-purple-900'
                    };

                    const taglines: Record<string, string> = {
                        starter: 'Start Selling',
                        growth: 'Get More Orders',
                        pro: 'Scale Your Kitchen',
                        elite: 'Build Your Food Brand'
                    };

                    const billingText: Record<string, string> = {
                        starter: '/month',
                        growth: '/6 months (Rs.499/mo)',
                        pro: '/year',
                        elite: '/year'
                    };

                    return (
                        <div key={plan.planId} className={cn("rounded-2xl border bg-white overflow-hidden shadow-sm flex flex-col relative", isCurrent && "ring-2 ring-orange-500")}>
                            
                            {plan.planId === 'growth' && (
                                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10">
                                    Most Popular
                                </div>
                            )}

                            <div className={cn("p-6", bgColors[plan.planId])}>
                                <h3 className="text-white text-xl font-bold">{plan.displayName}</h3>
                                <p className="text-white/80 text-sm">{taglines[plan.planId]}</p>
                                <div className="mt-4">
                                    <span className="text-3xl font-extrabold text-white">Rs.{plan.priceRs}</span>
                                    <span className="text-white/70 text-sm ml-1">{billingText[plan.planId]}</span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <ul className="space-y-3 mb-8 text-sm">
                                    <FeatureItem included label={`Menu items (${plan.menuItemLimit === -1 ? 'Unlimited' : plan.menuItemLimit})`} />
                                    <FeatureItem included label={`Monthly orders (${plan.monthlyOrderLimit === -1 ? 'Unlimited' : plan.monthlyOrderLimit})`} />
                                    <FeatureItem included label={`Commission (${plan.commissionRate * 100}%)`} />
                                    <FeatureItem included label={`Group Deals (${plan.potluckUsesPerPeriod === -1 ? 'Unlimited' : plan.potluckUsesPerPeriod === 2 ? '2/mo' : plan.potluckUsesPerPeriod === 10 ? '10/6mo' : '12/mo'})`} />
                                    <FeatureItem included label="Featured listing level" />
                                    <FeatureItem included label="Analytics level" />
                                    <FeatureItem included={idx >= 1} label="Cook AI Helper" />
                                    <FeatureItem included={idx >= 2} label="Branding tools" />
                                    <FeatureItem included={idx >= 2} label="Digital Khata" />
                                    <FeatureItem included={idx >= 3} label="AI Pricing" />
                                    <FeatureItem included={idx >= 3} label="Account Manager" />
                                </ul>

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        disabled={isCurrent || isDowngrade || checkoutLoading === plan.planId || loading}
                                        onClick={() => handleCheckout(plan.planId)}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl text-sm font-bold transition-colors",
                                            isCurrent ? "bg-gray-100 text-gray-500 cursor-not-allowed" :
                                            isDowngrade ? "border-2 border-gray-200 text-gray-400 bg-transparent cursor-not-allowed hidden" :
                                            "bg-orange-500 text-white hover:bg-orange-600"
                                        )}
                                    >
                                        {checkoutLoading === plan.planId ? "Loading..." :
                                         isCurrent ? "Current Plan ✓" :
                                         isDowngrade ? "Included" :
                                         !data ? "Get Started" : `Upgrade to ${plan.displayName}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* POTLUCK EXPLAINER BOX */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-orange-700 mb-4">🫕 What is Community Potluck?</h3>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Cook a batch of meals at a group discount price. Set your target (e.g., 10 orders needed). Customers reserve their spot. When the target is reached, the deal activates automatically — you sell in bulk, they save money. If target isn't met by expiry, everyone is released.
                        <br/><br/>
                        <strong>Uses per plan:</strong> 2/mo · 10/6mo · 12/mo · ∞
                    </p>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                        <div className="font-semibold text-sm">Chicken Biryani Group Deal</div>
                        <div className="text-xs text-gray-500 mb-2">Rs.200 (normally Rs.300)</div>
                        
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                            <div 
                                className="h-full bg-orange-500 rounded-full animate-[fillBar_4s_ease-in-out_infinite]"
                                style={{
                                    animation: 'fillBar 4s ease-in-out infinite'
                                }}
                            />
                        </div>
                        <div className="text-xs text-orange-700 font-medium text-right animate-[textChange_4s_ease-in-out_infinite]">
                            7/10 orders → 10/10 ✓ ACTIVATED!
                        </div>
                        
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes fillBar {
                                0%, 20% { width: 70%; background-color: #f97316; }
                                50%, 80% { width: 100%; background-color: #22c55e; }
                                100% { width: 70%; background-color: #f97316; }
                            }
                            @keyframes textChange {
                                0%, 20% { content: "7/10 orders"; color: #c2410c; opacity: 1; }
                                50%, 80% { content: "10/10 ✓ ACTIVATED!"; color: #15803d; opacity: 1; }
                                100% { content: "7/10 orders"; color: #c2410c; opacity: 1; }
                            }
                        `}} />
                    </div>
                </div>
            </div>

            {/* COMPARISON TABLE */}
            <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="bg-gray-50 text-xs uppercase text-gray-500 p-4 border-b border-gray-200">Feature</th>
                            <th className="bg-gray-50 text-xs uppercase text-gray-700 p-4 border-b border-gray-200 text-center">Starter</th>
                            <th className="bg-orange-50 text-xs uppercase text-orange-700 p-4 border-b border-orange-200 text-center relative"><span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Popular</span>Growth</th>
                            <th className="bg-blue-50 text-xs uppercase text-blue-700 p-4 border-b border-blue-200 text-center">Pro</th>
                            <th className="bg-purple-50 text-xs uppercase text-purple-700 p-4 border-b border-purple-200 text-center">Elite</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        <TableRow label="Menu Items" v1="7" v2="14" v3="15" v4="∞" currentPlan={data?.planId} />
                        <TableRow label="Monthly Orders" v1="50" v2="200" v3="2000" v4="∞" currentPlan={data?.planId} />
                        <TableRow label="Commission" v1="5%" v2="3%" v3="0%" v4="0%" currentPlan={data?.planId} />
                        <TableRow label="Group Deals" v1="2/mo" v2="10/6mo" v3="12" v4="∞" currentPlan={data?.planId} />
                        <TableRow label="Featured" v1="Basic" v2="Ltd" v3="High" v4="Top 👑" currentPlan={data?.planId} />
                        <TableRow label="Analytics" v1="Basic" v2="Med" v3="Adv" v4="AI ✨" currentPlan={data?.planId} />
                        <TableRow label="Cook AI Helper" v1="—" v2="✓" v3="✓" v4="✓" currentPlan={data?.planId} />
                        <TableRow label="Branding" v1="—" v2="Badge" v3="Full" v4="Brand" currentPlan={data?.planId} />
                        <TableRow label="Digital Khata" v1="—" v2="—" v3="✓" v4="✓" currentPlan={data?.planId} />
                        <TableRow label="AI Pricing" v1="—" v2="—" v3="—" v4="✓" currentPlan={data?.planId} />
                        <TableRow label="Account Manager" v1="—" v2="—" v3="—" v4="24/7" currentPlan={data?.planId} />
                    </tbody>
                </table>
            </div>
            
            {/* FAQ Mini-section */}
            <div className="max-w-2xl mx-auto text-center space-y-4 pt-8">
                <h3 className="font-semibold text-lg">Frequently Asked Questions</h3>
                <p className="text-sm text-gray-500">Need help choosing a plan? Our elite support team is here to assist you 24/7.</p>
            </div>
        </div>
    );
}

function FeatureItem({ included, label }: { included: boolean, label: string }) {
    return (
        <li className="flex items-start gap-2">
            {included ? (
                <span className="text-green-500 font-bold mt-0.5">✓</span>
            ) : (
                <span className="text-gray-300 mt-0.5">—</span>
            )}
            <span className={included ? "text-gray-700" : "text-gray-400"}>{label}</span>
        </li>
    );
}

function TableRow({ label, v1, v2, v3, v4, currentPlan }: { label: string, v1: string, v2: string, v3: string, v4: string, currentPlan?: string | null }) {
    const isStarter = currentPlan === 'starter';
    const isGrowth = currentPlan === 'growth';
    const isPro = currentPlan === 'pro';
    const isElite = currentPlan === 'elite';

    const renderVal = (v: string) => {
        if (v === '✓') return <span className="text-green-500 font-bold">✓</span>;
        if (v === '—') return <span className="text-gray-300">—</span>;
        return v;
    };

    return (
        <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
            <td className="p-4 font-medium text-gray-700">{label}</td>
            <td className={cn("p-4 text-center", isStarter && "bg-orange-50/30")}>{renderVal(v1)}</td>
            <td className={cn("p-4 text-center", isGrowth && "bg-orange-50/30")}>{renderVal(v2)}</td>
            <td className={cn("p-4 text-center", isPro && "bg-orange-50/30")}>{renderVal(v3)}</td>
            <td className={cn("p-4 text-center", isElite && "bg-orange-50/30")}>{renderVal(v4)}</td>
        </tr>
    );
}
