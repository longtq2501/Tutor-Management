'use client';

import { AnimatePresence } from 'framer-motion';
import { TourSpotlight } from './TourSpotlight';
import { TourStep } from './TourStep';
import { useTour } from './useTour';

interface TourOverlayProps {
  onComplete: () => void;
}

export const TourOverlay = ({ onComplete }: TourOverlayProps) => {
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
  } = useTour(onComplete);

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
