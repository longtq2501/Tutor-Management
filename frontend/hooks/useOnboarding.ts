'use client';

import { getTourStatus } from '@/lib/api/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const useOnboarding = () => {
  const { user, loading, markTourCompleted } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [dismissedInSession, setDismissedInSession] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || dismissedInSession) {
      setShowTour(false);
      return;
    }

    const shouldShowTour = user.role === 'TUTOR' && getTourStatus(user.tourCompleted) === false;
    if (!shouldShowTour) {
      setShowTour(false);
      return;
    }

    const timer = window.setTimeout(() => setShowTour(true), 800);
    return () => window.clearTimeout(timer);
  }, [dismissedInSession, loading, user]);

  const handleTourComplete = (didPersist = true) => {
    if (didPersist) {
      markTourCompleted();
    }

    setDismissedInSession(true);
    setShowTour(false);
  };

  return { showTour, handleTourComplete };
};
