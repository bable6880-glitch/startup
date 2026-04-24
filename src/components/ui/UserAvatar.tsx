'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
    src: string | null | undefined
    name: string | null | undefined
    size?: 'xs' | 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
}

const colors = [
    'bg-orange-100 text-orange-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
]

export default function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
    const [imgError, setImgError] = useState(false)

    const initials = (name ?? 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const colorIndex = (name ?? 'U').charCodeAt(0) % colors.length
    const colorClass = colors[colorIndex]

    if (!src || imgError) {
        return (
            <div
                className={cn(
                    'rounded-full flex items-center justify-center font-medium flex-shrink-0',
                    sizeMap[size],
                    colorClass,
                    className
                )}
            >
                {initials}
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={name ?? 'User'}
            onError={() => setImgError(true)}
            className={cn(
                'rounded-full object-cover flex-shrink-0',
                sizeMap[size],
                className
            )}
            referrerPolicy="no-referrer"
        />
    )
}
