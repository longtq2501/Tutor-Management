'use client';

import { motion } from 'framer-motion';
import type { TourStep as TourStepType } from './useTour';

interface TourStepProps {
  step: TourStepType;
  currentIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  isFirstStep: boolean;
  isCompleting: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  onSkip: () => void;
}

export const TourStep = ({
  step,
  currentIndex,
  totalSteps,
  isLastStep,
  isFirstStep,
  isCompleting,
  onNext,
  onPrev,
  onFinish,
  onSkip,
}: TourStepProps) => {
  const isCenter = step.position === 'center';

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={[
        'fixed z-[999] rounded-2xl border border-white/10 bg-[#0d0d1a] p-5 shadow-2xl',
        'w-[min(92vw,30rem)]',
        isCenter
          ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'right-4 top-1/2 -translate-y-1/2 md:right-8',
      ].join(' ')}
    >
      <div className="mb-4 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 rounded-full transition-all duration-300',
              i === currentIndex
                ? 'w-6 bg-[#7c6aff]'
                : i < currentIndex
                  ? 'w-1.5 bg-[#7c6aff]/40'
                  : 'w-1.5 bg-white/10',
            ].join(' ')}
          />
        ))}
        <span className="ml-auto text-[11px] text-[#666680]">
          {currentIndex + 1} / {totalSteps}
        </span>
      </div>

      <h3 className="mb-2 text-[18px] font-bold text-white">{step.title}</h3>
      <p className="mb-6 text-[14px] leading-[1.7] text-[#9a9ab8]">{step.description}</p>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] text-[#666680] transition-colors hover:text-white"
        >
          Bỏ qua
        </button>

        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-[#b1b1cb] transition-all hover:border-white/20"
            >
              ← Trước
            </button>
          )}
          {isLastStep ? (
            <button
              type="button"
              onClick={onFinish}
              disabled={isCompleting}
              className="rounded-lg bg-[#7c6aff] px-5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isCompleting ? 'Đang lưu...' : 'Bắt đầu sử dụng 🚀'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-[#7c6aff] px-5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90"
            >
              Tiếp theo →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
