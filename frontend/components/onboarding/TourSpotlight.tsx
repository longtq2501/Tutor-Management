'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourSpotlightProps {
  targetSelector?: string;
}

export const TourSpotlight = ({ targetSelector }: TourSpotlightProps) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const PADDING = 8;

  useEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (!element) {
        setRect(null);
        return;
      }

      const r = element.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetSelector]);

  return (
    <div className="fixed inset-0 z-[998] pointer-events-none" aria-hidden="true">
      <svg width="100%" height="100%">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <AnimatePresence>
              {rect && (
                <motion.rect
                  key={targetSelector}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx={12}
                  fill="black"
                />
              )}
            </AnimatePresence>
          </mask>
        </defs>

        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#spotlight-mask)" />

        {rect && (
          <motion.rect
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx={12}
            fill="none"
            stroke="#7c6aff"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
};
