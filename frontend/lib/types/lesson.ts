export interface Lesson {
  id: number; // ID BÀI HỌC
  tutorName: string; // TÊN GIA SƯ GIẢNG DẠY
  title: string; // TIÊU ĐỀ BÀI HỌC
  summary?: string; // TÓM TẮT NGẮN GỌN NỘI DUNG
  content?: string; // NỘI DUNG CHI TIẾT (DẠNG MARKDOWN/HTML)
  lessonDate: string; // NGÀY DIỄN RA BUỔI HỌC
  videoUrl?: string; // ĐƯỜNG DẪN VIDEO BÀI GIẢNG (NẾU CÓ)
  thumbnailUrl?: string; // ẢNH ĐẠI DIỆN CỦA BÀI HỌC

  // DỮ LIỆU RIÊNG CỦA HỌC SINH (KHỚP VỚI LESSONRESPONSE DTO)
  studentId: number; // ID HỌC SINH ĐANG XEM
  studentName: string; // TÊN HỌC SINH ĐANG XEM
  isCompleted: boolean; // TRẠNG THÁI HỌC SINH ĐÃ ĐÁNH DẤU HOÀN THÀNH
  completedAt?: string; // THỜI ĐIỂM HỌC SINH HOÀN THÀNH BÀI HỌC
  videoProgress?: number; // TIẾN ĐỘ XEM VIDEO (0-100)
  learningStatus?: string; // TRẠNG THÁI HỌC TẬP (Đang học, Gần hoàn thành...)
  learningStatusColor?: string; // MÀU SẮC GỢI Ý CHO TRẠNG THÁI
  canUnlockNext?: boolean; // CÓ THỂ MỞ KHÓA BÀI HỌC TIẾP THEO
  viewCount: number; // TỔNG SỐ LẦN HỌC SINH ĐÃ TRUY CẬP BÀI NÀY
  lastViewedAt?: string; // LẦN CUỐI CÙNG HỌC SINH XEM BÀI

  // MEDIA & TIMESTAMPS
  images?: LessonImage[]; // DANH SÁCH ẢNH MINH HỌA TRONG BÀI HỌC
  resources?: LessonResource[]; // DANH SÁCH TÀI LIỆU ĐÍNH KÈM (PDF, LINK...)
  createdAt: string; // THỜI GIAN TẠO BÀI HỌC TRÊN HỆ THỐNG
  updatedAt: string; // THỜI GIAN CẬP NHẬT BÀI HỌC GẦN NHẤT
  category?: {
    id: number;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface CourseNavigation {
  courseId: number;
  courseTitle: string;
  currentLessonId: number;
  currentLessonOrder: number;
  currentProgress: number;
  previousLessonId: number | null;
  previousLessonTitle: string | null;
  hasPrevious: boolean;
  nextLessonId: number | null;
  nextLessonTitle: string | null;
  hasNext: boolean;
  canNavigateNext: boolean;
  nextLessonLockedReason: string | null;
  totalLessons: number;
  completedLessons: number;
  courseProgressPercentage: number;
}

export interface LessonImage {
  id: number; // ID ẢNH
  imageUrl: string; // ĐƯỜNG DẪN ẢNH (CLOUDINARY)
  caption?: string; // CHÚ THÍCH CHO ẢNH
  displayOrder: number; // THỨ TỰ HIỂN THỊ CỦA ẢNH
}

export interface LessonResource {
  id: number; // ID TÀI LIỆU
  title: string; // TÊN TÀI LIỆU
  description?: string; // MÔ TẢ TÀI LIỆU
  resourceUrl: string; // ĐƯỜNG DẪN TẢI HOẶC TRUY CẬP TÀI LIỆU
  resourceType: 'PDF' | 'LINK' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'; // LOẠI ĐỊNH DẠNG TÀI LIỆU
  fileSize?: number; // DUNG LƯỢNG FILE (BYTE)
  formattedFileSize?: string; // DUNG LƯỢNG FILE ĐÃ ĐỊNH DẠNG (VÍ DỤ: 1.2 MB)
  displayOrder: number; // THỨ TỰ HIỂN THỊ TRONG DANH SÁCH
}

export interface LessonProgress {
  lessonId: number;
  lessonTitle: string;
  videoProgress: number;
  learningStatus: string;
  learningStatusColor: string;
  isCompleted: boolean;
  completedAt: string;
  canUnlockNext: boolean;
  lastProgressUpdate: string;
  viewCount: number;
  lastViewedAt: string;
}

export interface LessonStats {
  totalLessons: number; // TỔNG SỐ BÀI HỌC ĐÃ GIAO
  completedLessons: number; // SỐ BÀI ĐÃ HOÀN THÀNH
  inProgressLessons: number; // SỐ BÀI ĐANG HỌC DANG DỞ
  completionRate: number; // TỶ LỆ PHẦN TRĂM HOÀN THÀNH (%)
}