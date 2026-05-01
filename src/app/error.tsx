'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Application Error:', error);

        // Auto-redirect after 5 seconds
        const timer = setTimeout(() => {
            router.push('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [error, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col items-center p-8 text-center">
                
                <h1 className="text-4xl font-black text-[#DE3E5B] mb-8">
                    Oups!
                </h1>

                {/* SVG Illustration */}
                <div className="w-56 h-56 mb-8 relative">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* Background blob */}
                        <path d="M165.5 138.5C188.5 111 178 61 148.5 35.5C119 10 70.5 9 41.5 31.5C12.5 54 3 100 13 133.5C23 167 52.5 188 88.5 190.5C124.5 193 142.5 166 165.5 138.5Z" fill="#F44265"/>
                        {/* Shadow hole */}
                        <ellipse cx="100" cy="170" rx="60" ry="8" fill="black"/>
                        {/* Person outline placeholder (simplified for code) */}
                        <path d="M130 110C130 140 120 160 100 160C80 160 70 140 70 110C70 80 80 60 100 60C120 60 130 80 130 110Z" fill="#FFF1EB"/>
                        <path d="M130 110C130 140 120 160 100 160C80 160 70 140 70 110C70 80 80 60 100 60C120 60 130 80 130 110Z" stroke="black" strokeWidth="2"/>
                        <path d="M70 110L130 110" stroke="black" strokeWidth="2"/>
                        <path d="M100 60C100 60 105 40 110 40C115 40 120 45 115 50" stroke="black" strokeWidth="2" fill="black"/>
                        {/* Phone */}
                        <rect x="110" y="100" width="12" height="20" rx="2" fill="#333"/>
                    </svg>
                    
                    {/* Chat bubbles */}
                    <div className="absolute top-0 left-0 bg-white border border-gray-200 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-400 shadow-sm">
                        ???
                    </div>
                    <div className="absolute top-6 left-0 bg-white border border-gray-200 rounded-lg px-2 py-1 flex gap-1 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
                    Something went wrong
                </h2>

                <p className="text-sm text-gray-600 mb-8 leading-relaxed max-w-[260px]">
                    we encountered an error <br/>
                    while trying to connect with our server.
                    <br/><br/>
                    Please try after some time. 😅
                </p>

                <Link 
                    href="/"
                    className="w-full bg-[#DE3E5B] text-white font-bold py-4 rounded-xl hover:bg-[#C9324C] transition-colors shadow-lg shadow-[#DE3E5B]/20"
                >
                    Return to home
                </Link>
            </div>
        </div>
    );
}
