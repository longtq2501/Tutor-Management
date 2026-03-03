
// ============================================================================
// FILE: lib/hooks/useLazyImage.ts
// ============================================================================
import { useEffect, useState, useRef } from 'react';

export const useLazyImage = (src: string) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If IntersectionObserver is not supported, load immediately
        if (!window.IntersectionObserver) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImageSrc(prev => prev !== src ? src : prev);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoaded(prev => prev !== true ? true : prev);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setImageSrc(src);
                observer.disconnect();
            }
        });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [src]);

    return { imageSrc, isLoaded, observerRef };
};
