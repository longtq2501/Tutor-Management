import api from '@/lib/services/axios-instance';

export const completeTour = async (): Promise<void> => {
  await api.patch('/user/tour-complete');
};

export const getTourStatus = (tourCompleted?: boolean): boolean => {
  return Boolean(tourCompleted);
};
