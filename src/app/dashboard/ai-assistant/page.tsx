"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RotateCcw, Copy, Check, Lock, ChevronRight } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { useAuth } from "@/lib/firebase/auth-context";
import { BackButton } from "@/components/ui/BackButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageRole = "user" | "assistant";

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
}

const STARTER_PROMPTS = [
    { icon: "🍛", label: "Menu Ideas", prompt: "Suggest 5 new menu items I can add that would complement my existing biryani and karahi dishes." },
    { icon: "📸", label: "Photo Tips", prompt: "How can I take better food photos with just my smartphone to attract more customers?" },
    { icon: "⭐", label: "Get More Reviews", prompt: "What's the best way to politely ask my regular customers to leave a review?" },
    { icon: "📈", label: "Boost Sales", prompt: "My orders drop on weekdays. What strategies can I use to increase orders Monday–Thursday?" },
    { icon: "🎁", label: "Promotions", prompt: "Design a promotion strategy for Eid season that increases both order volume and order value." },
    { icon: "🥗", label: "Seasonal Menu", prompt: "What dishes should I add during summer to attract health-conscious customers in Pakistan?" },
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Thinking...");
    const [usageCount, setUsageCount] = useState<number | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { data: planData, loading: planLoading } = usePlanAccess();
    const { getIdToken } = useAuth();

    const DAILY_LIMIT = 20;

    // Check if user has access (Growth plan or above)
    const PLAN_ORDER = ["starter", "growth", "pro", "elite"];
    const planIdx = PLAN_ORDER.indexOf(planData?.planId ?? "");
    const hasChefAI = planIdx >= 1; // growth (1) or above

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(content: string) {
        if (!content.trim() || loading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setLoadingText("Thinking...");

        // Dynamic loading text
        const loadingInterval = setInterval(() => {
            setLoadingText(prev => prev === "Thinking..." ? "Analyzing..." : prev === "Analyzing..." ? "Generating Advice..." : "Thinking...");
        }, 1500);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        try {
            const token = await getIdToken();
            const res = await fetch("/api/seller/ai/chef-assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: content.trim(),
                    context: messages.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n"),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error(data.message || "You've reached your 20 daily messages. Resets at midnight.");
                }
                throw new Error(data.error ?? "Assistant unavailable");
            }

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            if (data.remainingToday !== undefined) {
                setUsageCount(DAILY_LIMIT - data.remainingToday);
            }
        } catch (err) {
            const errorMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            clearInterval(loadingInterval);
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function copyMessage(id: string, content: string) {
        navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }

    if (planLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 w-48 bg-neutral-200 rounded-lg dark:bg-neutral-700" />
                    <div className="h-[60vh] bg-neutral-100 rounded-2xl dark:bg-neutral-800" />
                </div>
            </div>
        );
    }

    // Locked for plans without chef AI
    if (!hasChefAI) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <BackButton label="Dashboard" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-8">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100
                                        dark:from-amber-900/20 dark:to-orange-900/20
                                        border border-amber-200 dark:border-amber-500/20
                                        flex items-center justify-center">
                            <span className="text-3xl">👨‍🍳</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800
                                        border border-neutral-200 dark:border-neutral-700
                                        flex items-center justify-center">
                            <Lock className="w-3 h-3 text-neutral-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Chef AI Assistant</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm leading-relaxed">
                            Get personalized menu ideas, marketing advice, and business strategies from your
                            AI-powered chef assistant. Available on Growth plan and above.
                        </p>
                    </div>
                    <a
                        href="/dashboard/subscription"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500
                                   text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        Upgrade to Growth Plan <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-4 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
            <BackButton label="Dashboard" />

            {/* Page header */}
            <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-700 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500
                                    flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <span className="text-lg">👨‍🍳</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-neutral-900 dark:text-white">Chef AI Assistant</h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Your personal business advisor</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {usageCount !== null && (
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <div className="w-20 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all"
                                    style={{ width: `${(usageCount / DAILY_LIMIT) * 100}%` }}
                                />
                            </div>
                            <span>{usageCount}/{DAILY_LIMIT}</span>
                        </div>
                    )}
                    {messages.length > 0 && (
                        <button
                            onClick={() => { setMessages([]); setUsageCount(null); }}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100
                                       dark:hover:bg-neutral-800 dark:hover:text-neutral-300
                                       transition-colors text-xs flex items-center gap-1"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            New chat
                        </button>
                    )}
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">

                {/* Empty state — starter prompts */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center pt-8 gap-6">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100
                                            dark:from-amber-900/20 dark:to-orange-900/20
                                            border border-amber-200 dark:border-amber-500/20
                                            flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-amber-500" />
                            </div>
                            <h2 className="text-neutral-900 dark:text-white font-bold mb-1">How can I help your kitchen today?</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Ask me anything about your menu, marketing, or business.</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-2xl">
                            {STARTER_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    onClick={() => sendMessage(prompt.prompt)}
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700
                                               bg-white dark:bg-neutral-800/50 text-left
                                               hover:border-amber-300 dark:hover:border-amber-500/30
                                               hover:bg-amber-50 dark:hover:bg-amber-500/5
                                               transition-all group"
                                >
                                    <span className="text-lg block mb-1">{prompt.icon}</span>
                                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300
                                                     group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                        {prompt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message list */}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            message.role === "assistant"
                                ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}>
                            {message.role === "assistant" ? "AI" : "U"}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[75%] group flex flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none ${
                                message.role === "user"
                                    ? "bg-amber-500 text-white rounded-tr-sm prose-p:text-white prose-strong:text-white"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-sm"
                            }`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            </div>

                            {message.role === "assistant" && (
                                <button
                                    onClick={() => copyMessage(message.id, message.content)}
                                    className="flex items-center gap-1 text-xs text-neutral-400
                                               hover:text-neutral-600 dark:hover:text-neutral-300
                                               transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {copied === message.id ? (
                                        <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3 h-3" /> Copy</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500
                                        flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            AI
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-neutral-100 dark:bg-neutral-800">
                            <div className="flex items-center gap-1">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce"
                                        style={{ animationDelay: `${i * 150}ms` }}
                                    />
                                ))}
                                <span className="ml-2 text-xs text-neutral-500 font-medium">{loadingText}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="py-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-end gap-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl
                                border border-neutral-200 dark:border-neutral-700
                                focus-within:border-amber-400 dark:focus-within:border-amber-500/40
                                transition-colors p-2 pl-4">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(input);
                            }
                        }}
                        placeholder="Ask about menu ideas, marketing, pricing strategy..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white
                                   placeholder-neutral-400 dark:placeholder-neutral-500
                                   resize-none outline-none leading-relaxed py-1 max-h-[120px]"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center
                                   disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400
                                   transition-colors flex-shrink-0 mb-0.5"
                    >
                        <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-2">
                    Shift+Enter for new line · {DAILY_LIMIT} messages per day
                </p>
            </div>
        </div>
    );
}
