'use client';

import { getTourStatus } from '@/lib/api/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const useOnboarding = () => {
  const { user, loading, markTourCompleted } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [dismissedInSession, setDismissedInSession] = useState(false);

  const shouldShowTour =
    user?.role === 'TUTOR' && getTourStatus(user.tourCompleted) === false;

  useEffect(() => {
    if (loading || !user || dismissedInSession || !shouldShowTour) {
      return;
    }

    const timer = window.setTimeout(() => setShowTour(true), 800);
    return () => window.clearTimeout(timer);
  }, [dismissedInSession, loading, user, shouldShowTour]);

  const handleTourComplete = (didPersist = true) => {
    if (didPersist) {
      markTourCompleted();
    }

    setDismissedInSession(true);
    setShowTour(false);
  };

  const isTourVisible = showTour && shouldShowTour && !dismissedInSession;

  return { showTour: isTourVisible, handleTourComplete };
};
