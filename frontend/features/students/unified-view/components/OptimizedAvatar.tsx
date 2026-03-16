import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import Image from 'next/image';

interface OptimizedAvatarProps {
    name: string;
    isActive?: boolean;
    className?: string; // Allow custom sizing/styling
    avatarUrl?: string; // Optional backend URL
}

export function OptimizedAvatar({ name, isActive, className, avatarUrl }: OptimizedAvatarProps) {
    const initials = useMemo(() => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);
    const hue = useMemo(() => {
        // Generate consistent color from name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 360);
    }, [name]);

    return (
        <div
            className={cn(
                "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shrink-0 overflow-hidden",
                "contain-paint will-change-transform", // Performance optimization
                className
            )}
            style={{
                background: avatarUrl ? undefined : `linear-gradient(135deg, hsl(${hue}, 70%, 50%) 0%, hsl(${hue}, 70%, 40%) 100%)`
            }}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 56px, 64px"
                    className="object-cover"
                />
            ) : (
                <span className="select-none text-[10px] sm:text-xs font-black uppercase tracking-tighter">{initials}</span>
            )}

            {/* Status dot - pure CSS, no image */}
            {isActive !== undefined && (
                <div
                    className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background",
                        isActive ? "bg-green-500" : "bg-gray-400"
                    )}
                />
            )}
        </div>
    );
}
