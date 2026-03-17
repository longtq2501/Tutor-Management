import { useCallback, useMemo, useState } from 'react';
import { completeTour } from '@/lib/api/onboarding';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'center' | 'right';
}

const TUTOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Chao mung den voi Tutor Pro! 🎉',
    description:
      'Nen tang quan ly gia su toan dien - lich day, tai chinh, lop hoc truc tuyen va he thong ho tro day hoc. Hay xem nhanh cac tinh nang chinh.',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Tong quan Dashboard',
    description:
      'Day la khu vuc tong quan. Menu ben trai giup ban dieu huong den tung module quan trong.',
    targetSelector: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    id: 'calendar',
    title: 'Lich day thong minh 📅',
    description:
      'Quan ly lich day tai day. Ban co the theo doi va dieu phoi lich day cho tung hoc sinh de tranh trung gio.',
    targetSelector: '[data-tour="nav-calendar"]',
    position: 'right',
  },
  {
    id: 'finance',
    title: 'Quan ly Tai chinh 💰',
    description:
      'Theo doi doanh thu, cong no va trang thai thanh toan. Nhung so lieu quan trong deu tap trung o mot noi.',
    targetSelector: '[data-tour="nav-finance"]',
    position: 'right',
  },
  {
    id: 'live-teaching',
    title: 'Lop hoc Truc tuyen 🎥',
    description:
      'Day hoc qua phong hoc truc tuyen voi cong cu tuong tac thoi gian thuc va thong tin buoi hoc duoc dong bo.',
    targetSelector: '[data-tour="nav-live-teaching"]',
    position: 'right',
  },
  {
    id: 'materials',
    title: 'Kho Tai lieu 📁',
    description:
      'Luu tru va quan ly tai lieu giang day tap trung, giup ban tim kiem va tai su dung nhanh cho tung lop hoc.',
    targetSelector: '[data-tour="nav-materials"]',
    position: 'right',
  },
  {
    id: 'lecture',
    title: 'Bai giang 🎓',
    description:
      'Soan va quan ly bai giang theo tung hoc sinh, theo doi tien do hoc tap qua tung buoi day.',
    targetSelector: '[data-tour="nav-lecture"]',
    position: 'right',
  },
  {
    id: 'assessment',
    title: 'Khao thi va Cham diem 📝',
    description:
      'Soan de, to chuc bai kiem tra va theo doi ket qua hoc tap trong cung he thong.',
    targetSelector: '[data-tour="nav-assessment"]',
    position: 'right',
  },
  {
    id: 'done',
    title: 'Ban da san sang! 🚀',
    description:
      'Do la toan bo huong dan nhanh de bat dau. Chuc ban co trai nghiem day hoc hieu qua voi Tutor Pro.',
    position: 'center',
  },
];

export const useTour = (onComplete: () => void) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalSteps = TUTOR_TOUR_STEPS.length;
  const currentStepData = useMemo(() => TUTOR_TOUR_STEPS[currentStep], [currentStep]);
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const finishTour = useCallback(async () => {
    setIsCompleting(true);
    try {
      await completeTour();
    } catch (error) {
      // Do not block user if persisting status fails.
      console.error('Failed to save tour status:', error);
    } finally {
      setIsCompleting(false);
      onComplete();
    }
  }, [onComplete]);

  const skipTour = useCallback(async () => {
    await finishTour();
  }, [finishTour]);

  return {
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
  };
};
