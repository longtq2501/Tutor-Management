import { useCallback, useEffect, useMemo, useState } from 'react';
import { completeTour } from '@/lib/api/onboarding';

export type TourView =
  | 'dashboard'
  | 'students'
  | 'finance'
  | 'calendar'
  | 'exercises'
  | 'documents'
  | 'lessons'
  | 'live-room'
  | 'settings';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'center' | 'right';
  view?: TourView;
}

const TUTOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Chào mừng đến với Tutor Pro! 🎉',
    description:
      'Nền tảng quản lý gia sư toàn diện. Tour sẽ tự chuyển từng module và giới thiệu các khu vực quan trọng để bạn bắt đầu nhanh.',
    position: 'center',
  },
  {
    id: 'dashboard-module',
    title: 'Module Tổng quan',
    description:
      'Đây là trung tâm theo dõi nhanh toàn bộ hoạt động. Chúng tôi sẽ đi qua các thành phần quan trọng trong trang này.',
    targetSelector: '[data-tour="module-dashboard"]',
    view: 'dashboard',
    position: 'right',
  },
  {
    id: 'dashboard-stats',
    title: 'Cụm chỉ số nhanh',
    description:
      'Các thẻ này hiển thị học sinh, doanh thu và công nợ theo thời gian thực để bạn nắm bức tranh tổng quan ngay khi mở trang.',
    targetSelector: '[data-tour="dashboard-stats"]',
    view: 'dashboard',
    position: 'right',
  },
  {
    id: 'dashboard-revenue',
    title: 'Biểu đồ doanh thu',
    description:
      'Đây là biểu đồ theo dõi doanh thu hàng tháng của bạn, kèm chi tiết từng tháng để phân tích xu hướng tăng giảm.',
    targetSelector: '[data-tour="dashboard-revenue-chart"]',
    view: 'dashboard',
    position: 'right',
  },
  {
    id: 'students-module',
    title: 'Module Học sinh & Phụ huynh',
    description:
      'Trang này quản lý hồ sơ học sinh, phụ huynh và các thao tác nhanh như tìm kiếm, lọc và thêm học sinh.',
    targetSelector: '[data-tour="module-students"]',
    view: 'students',
    position: 'right',
  },
  {
    id: 'students-stats',
    title: 'Thống kê học sinh',
    description:
      'Khu vực này cho biết số học sinh đang học, đã nghỉ, phụ huynh và tổng nợ để bạn theo dõi chất lượng vận hành lớp.',
    targetSelector: '[data-tour="students-stats"]',
    view: 'students',
    position: 'right',
  },
  {
    id: 'students-grid',
    title: 'Danh sách học sinh',
    description:
      'Đây là danh sách học sinh. Bạn có thể mở chi tiết, chỉnh sửa, thêm buổi học hoặc xem lịch ngay trên từng thẻ.',
    targetSelector: '[data-tour="students-grid"]',
    view: 'students',
    position: 'right',
  },
  {
    id: 'finance-module',
    title: 'Module Tài chính',
    description:
      'Trang tài chính giúp theo dõi doanh thu, công nợ và trạng thái thanh toán của từng học sinh.',
    targetSelector: '[data-tour="module-finance"]',
    view: 'finance',
    position: 'right',
  },
  {
    id: 'finance-stats',
    title: 'Chỉ số tài chính',
    description:
      'Các chỉ số này tổng hợp doanh thu, số buổi học, tổng giờ dạy và mức độ cần xử lý công nợ.',
    targetSelector: '[data-tour="finance-stats"]',
    view: 'finance',
    position: 'right',
  },
  {
    id: 'finance-content',
    title: 'Danh sách công nợ & phiên học',
    description:
      'Tại đây bạn xử lý từng học sinh, cập nhật trạng thái đã thanh toán và thực hiện các thao tác tài chính chi tiết.',
    targetSelector: '[data-tour="finance-content"]',
    view: 'finance',
    position: 'right',
  },
  {
    id: 'calendar-module',
    title: 'Module Lịch dạy',
    description:
      'Lịch dạy là nơi bạn theo dõi toàn bộ buổi học, kéo thả lịch và xử lý xung đột lịch theo ngày/tuần/tháng.',
    targetSelector: '[data-tour="module-calendar"]',
    view: 'calendar',
    position: 'right',
  },
  {
    id: 'calendar-board',
    title: 'Bảng lịch học',
    description:
      'Đây là vùng lịch chính để xem và thao tác buổi học trực tiếp. Bạn có thể mở nhanh chi tiết từng phiên học tại đây.',
    targetSelector: '[data-tour="calendar-board"]',
    view: 'calendar',
    position: 'right',
  },
  {
    id: 'assessment-module',
    title: 'Module Khảo thí',
    description:
      'Khu vực này dùng để quản lý bài tập, kiểm tra và đánh giá tiến độ học tập của học sinh.',
    targetSelector: '[data-tour="module-exercises"]',
    view: 'exercises',
    position: 'right',
  },
  {
    id: 'materials-module',
    title: 'Module Tài liệu',
    description:
      'Kho tài liệu giúp bạn lưu trữ, phân loại và truy cập học liệu phục vụ giảng dạy trên một nơi tập trung.',
    targetSelector: '[data-tour="module-documents"]',
    view: 'documents',
    position: 'right',
  },
  {
    id: 'lesson-module',
    title: 'Module Bài giảng',
    description:
      'Đây là khu vực soạn và tổ chức bài giảng theo từng lớp học hoặc học sinh, giúp theo dõi tiến độ học tập xuyên suốt.',
    targetSelector: '[data-tour="module-lessons"]',
    view: 'lessons',
    position: 'right',
  },
  {
    id: 'live-module',
    title: 'Module Lớp học trực tuyến',
    description:
      'Khu vực này hỗ trợ dạy học trực tuyến theo phòng học thời gian thực khi bạn bắt đầu buổi học.',
    targetSelector: '[data-tour="module-live-room"]',
    view: 'live-room',
    position: 'right',
  },
  {
    id: 'settings-module',
    title: 'Module Cài đặt',
    description:
      'Tại đây bạn cập nhật thông tin cá nhân, cấu hình tài khoản và các thiết lập hệ thống quan trọng.',
    targetSelector: '[data-tour="module-settings"]',
    view: 'settings',
    position: 'right',
  },
  {
    id: 'done',
    title: 'Bạn đã sẵn sàng! 🚀',
    description:
      'Bạn đã đi qua toàn bộ module quan trọng. Từ bây giờ bạn có thể chủ động điều hướng sidebar và sử dụng hệ thống bình thường.',
    position: 'center',
  },
];

export const useTour = (
  onComplete: (didPersist: boolean) => void,
  onNavigateView: (view: TourView) => void,
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalSteps = TUTOR_TOUR_STEPS.length;
  const currentStepData = useMemo(() => TUTOR_TOUR_STEPS[currentStep], [currentStep]);
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (currentStepData?.view) {
      onNavigateView(currentStepData.view);
    }
  }, [currentStepData?.view, onNavigateView]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const finishTour = useCallback(async () => {
    setIsCompleting(true);
    let didPersist = false;

    try {
      await completeTour();
      didPersist = true;
    } catch (error) {
      // Do not block user if persisting status fails.
      console.error('Failed to save tour status:', error);
    } finally {
      setIsCompleting(false);
      onComplete(didPersist);
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
