"use client";

import React, { useEffect, useState, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatValue?: (val: number) => string;
}

export function AnimatedNumber({
    value,
    duration = 1.5,
    formatValue = (val) => Math.round(val).toString(),
}: AnimatedNumberProps) {
    const [hasMounted, setHasMounted] = useState(false);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        duration: duration * 1000,
        bounce: 0,
    });
    
    // Formatting the number output
    const displayValue = useTransform(springValue, (current) => formatValue(current));

    useEffect(() => {
        setHasMounted(true);
        motionValue.set(value);
    }, [value, motionValue]);

    if (!hasMounted) {
        return <span>{formatValue(0)}</span>;
    }

    return <motion.span>{displayValue}</motion.span>;
}
