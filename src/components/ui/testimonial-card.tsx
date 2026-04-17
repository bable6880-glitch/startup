"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star, MessageSquareText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

// --- Type Definitions for props ---
export interface Stat {
  value: string | number;
  label: string;
}

export interface Testimonial {
  id: string;
  name: string;
  title?: string;
  quote?: string | null;
  avatarSrc?: string | null;
  rating: number;
  createdAt?: string;
}

export interface ClientsSectionProps {
  tagLabel: string;
  title: string;
  description: string;
  stats: Stat[];
  testimonials: Testimonial[];
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  className?: string;
}

// --- Internal Sub-Components ---

const StatCard = ({ value, label }: Stat) => (
  <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50 text-center rounded-2xl shadow-sm">
    <CardContent className="p-5 flex flex-col justify-center h-full">
      <p className="text-3xl font-black text-gray-900 dark:text-gray-50">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </CardContent>
  </Card>
);

const StickyTestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  return (
    <motion.div
      className="sticky w-full"
      style={{ top: `${80 + index * 24}px` }} // Staggered top position for stacking
    >
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col h-auto w-full transition-all",
        "bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800"
      )}>
        {/* Top section: Image and Author */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex justify-center items-center font-bold text-xl overflow-hidden shrink-0">
             {testimonial.avatarSrc ? (
                 <img src={testimonial.avatarSrc} alt="avatar" className="w-full h-full object-cover" />
             ) : testimonial.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{testimonial.name}</p>
            {testimonial.title && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{testimonial.title}</p>}
            {testimonial.createdAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })}
                </p>
            )}
          </div>
        </div>

        {/* Middle section: Rating */}
        <div className="flex items-center gap-2 my-5 bg-orange-50 dark:bg-neutral-800/50 w-max px-3 py-1.5 rounded-full">
          <span className="font-bold text-base text-gray-900 dark:text-gray-100">{testimonial.rating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(testimonial.rating)
                    ? "text-orange-500 fill-orange-500"
                    : "text-gray-300 dark:text-neutral-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Bottom section: Quote */}
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic">
            &ldquo;{testimonial.quote || 'Great experience with Smart Tiffin! Highly recommended.'}&rdquo;
        </p>
      </div>
    </motion.div>
  );
};

// --- Main Exported Component ---

export const ClientsSection = ({
  tagLabel,
  title,
  description,
  stats,
  testimonials,
  primaryActionLabel,
  onPrimaryAction,
  className,
}: ClientsSectionProps) => {
  // Cap how many render so Mobile views aren't a mile long
  const displayTestimonials = testimonials.slice(0, 5);
  
  // Calculate a height for the scroll container to ensure all cards can stack smoothly
  const scrollContainerHeight = `calc(100vh + ${displayTestimonials.length * 120}px)`;

  return (
    <section className={cn("w-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-50 py-20 px-4", className)}>
      <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        
        {/* Left Column: Sticky Content */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-32 z-10">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/30 px-4 py-1.5 text-sm font-semibold">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-800 dark:text-orange-300">{tagLabel}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{title}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">{description}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-lg">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
          
          <div className="flex items-center mt-6">
            <Button 
                size="lg" 
                onClick={onPrimaryAction}
                className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-xl shadow-orange-600/20 transition-all hover:-translate-y-0.5 gap-2"
            >
                <MessageSquareText className="w-5 h-5" />
                {primaryActionLabel}
            </Button>
          </div>
        </div>

        {/* Right Column: Container for the sticky card stack */}
        <div className="relative flex flex-col gap-6" style={{ height: displayTestimonials.length > 0 ? scrollContainerHeight : 'auto' }}>
          {displayTestimonials.length > 0 ? (
              displayTestimonials.map((testimonial, index) => (
                <StickyTestimonialCard
                  key={testimonial.id || testimonial.name}
                  index={index}
                  testimonial={testimonial}
                />
              ))
          ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] border border-dashed border-gray-200 dark:border-neutral-800 rounded-3xl bg-gray-50 dark:bg-neutral-900/50">
                  <p className="text-gray-500 font-medium">Be the first to review!</p>
              </div>
          )}
        </div>
      </div>
    </section>
  );
};
