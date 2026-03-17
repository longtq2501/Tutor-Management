'use client';

import { AnimatePresence } from 'framer-motion';
import type { TourView } from './useTour';
import { TourSpotlight } from './TourSpotlight';
import { TourStep } from './TourStep';
import { useTour } from './useTour';

interface TourOverlayProps {
  onComplete: (didPersist: boolean) => void;
  onNavigateView: (view: TourView) => void;
}

export const TourOverlay = ({ onComplete, onNavigateView }: TourOverlayProps) => {
  const {
    currentStep,
    currentStepData,
    totalSteps,
    isLastStep,
    isFirstStep,
    isCompleting,
    nextStep,
    prevStep,
    finishTour,
    skipTour,
  } = useTour(onComplete, onNavigateView);

  return (
    <>
      <TourSpotlight targetSelector={currentStepData.targetSelector} />
      <AnimatePresence mode="wait">
        <TourStep
          key={currentStepData.id}
          step={currentStepData}
          currentIndex={currentStep}
          totalSteps={totalSteps}
          isLastStep={isLastStep}
          isFirstStep={isFirstStep}
          isCompleting={isCompleting}
          onNext={nextStep}
          onPrev={prevStep}
          onFinish={finishTour}
          onSkip={skipTour}
        />
      </AnimatePresence>
    </>
  );
};
