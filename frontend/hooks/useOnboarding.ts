'use client';

import { getTourStatus } from '@/lib/api/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const useOnboarding = () => {
  const { user, markTourCompleted } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [dismissedInSession, setDismissedInSession] = useState(false);

  useEffect(() => {
    if (!user || dismissedInSession) {
      return;
    }

    const shouldShowTour = user.role === 'TUTOR' && !getTourStatus(user.tourCompleted);
    if (!shouldShowTour) {
      return;
    }

    const timer = window.setTimeout(() => setShowTour(true), 800);
    return () => window.clearTimeout(timer);
  }, [dismissedInSession, user]);

  const handleTourComplete = (didPersist = true) => {
    if (didPersist) {
      markTourCompleted();
    }

    setDismissedInSession(true);
    setShowTour(false);
  };

  return { showTour, handleTourComplete };
};
