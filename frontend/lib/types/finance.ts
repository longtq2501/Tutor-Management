import type { LessonStatus } from './lesson-status';

export interface SessionRecord {
  id: number; // ID BUỔI HỌC
  studentId: number; // ID HỌC SINH
  studentName: string; // TÊN HỌC SINH
  month: string; // THÁNG CỦA BUỔI HỌC (YYYY-MM)
  sessions: number; // SỐ BUỔI HỌC (THƯỜNG LÀ 1 CHO MỖI BẢN GHI)
  hours: number; // TỔNG SỐ GIỜ HỌC TRONG BUỔI
  pricePerHour: number; // ĐƠN GIÁ TRÊN MỖI GIỜ TẠI THỜI ĐIỂM ĐÓ
  totalAmount: number; // TỔNG TIỀN CỦA BUỔI HỌC (HOURS * PRICE)
  paid: boolean; // TRẠNG THÁI ĐÃ THANH TOÁN HAY CHƯA
  completed?: boolean; // TRẠNG THÁI ĐÃ HOÀN THÀNH BUỔI HỌC (deprecated, use status instead)
  paidAt?: string; // THỜI ĐIỂM THANH TOÁN
  notes?: string; // GHI CHÚ NỘI DUNG BUỔI HỌC
  sessionDate: string; // NGÀY DIỄN RA BUỔI HỌC (YYYY-MM-DD)
  hoursPerSession: number; // SỐ GIỜ ĐỊNH MỨC CỦA MỖI BUỔI
  createdAt: string; // NGÀY TẠO BẢN GHI

  // ========== NEW FIELDS FOR CALENDAR OPTIMIZATION ==========
  startTime?: string; // GIỜ BẮT ĐẦU (HH:mm format, e.g., "14:00")
  endTime?: string; // GIỜ KẾT THÚC (HH:mm format, e.g., "15:30")
  subject?: string; // MÔN HỌC (e.g., "Toán 10", "Lý 11")
  status?: LessonStatus; // TRẠNG THÁI CHI TIẾT (SCHEDULED, CONFIRMED, COMPLETED, PAID, etc.)
  version?: number; // VERSION FOR OPTIMISTIC LOCKING
  isOnline?: boolean; // TRẠNG THÁI BUỔI HỌC ONLINE
  tutorId?: number;
  tutorName?: string;

  // ========== ATTACHMENTS (LIBRARY) ==========
  documents?: DocumentDTO[];
  lessons?: LessonDTO[];
}

export interface DocumentDTO {
  id: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
}

export interface LessonDTO {
  id: number;
  title: string;
  summary: string;
  thumbnailUrl: string;
  durationMinutes: number;
  isPublished: boolean;
}

export interface SessionRecordRequest {
  studentId: number; // ID HỌC SINH
  month: string; // THÁNG QUẢN LÝ
  sessions: number; // SỐ BUỔI
  sessionDate: string; // NGÀY HỌC
  hoursPerSession: number; // SỐ GIỜ DẠY
  notes?: string; // NỘI DUNG GHI CHÚ
  completed?: boolean; // XÁC NHẬN HOÀN THÀNH
  startTime?: string;
  endTime?: string;
  subject?: string;
  status?: LessonStatus;
  documentIds?: number[];
  lessonIds?: number[];
}

export interface SessionRecordUpdateRequest {
  month?: string;
  sessions?: number;
  sessionDate?: string;
  hoursPerSession?: number;
  notes?: string;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
  subject?: string;
  status?: LessonStatus;
  version?: number;
  documentIds?: number[];
  lessonIds?: number[];
}

export interface InvoiceRequest {
  studentId?: number; // ID HỌC SINH CẦN XUẤT HÓA ĐƠN RIÊNG
  month: string; // THÁNG CẦN XUẤT HÓA ĐƠN
  sessionRecordIds?: number[]; // DANH SÁCH ID CÁC BUỔI HỌC CỤ THỂ
  allStudents?: boolean; // TÙY CHỌN XUẤT CHO TẤT CẢ HỌC SINH
  multipleStudents?: boolean; // TÙY CHỌN XUẤT CHO NHIỀU HỌC SINH CHỌN LỌC
  selectedStudentIds?: number[]; // DANH SÁCH ID HỌC SINH ĐƯỢC CHỌN
}

export interface InvoiceResponse {
  invoiceNumber: string; // SỐ HÓA ĐƠN DUY NHẤT
  studentName: string; // TÊN HỌC SINH NHẬN HÓA ĐƠN
  month: string; // THÁNG THANH TOÁN
  totalSessions: number; // TỔNG SỐ BUỔI TRONG THÁNG
  totalHours: number; // TỔNG SỐ GIỜ TRONG THÁNG
  totalAmount: number; // TỔNG TIỀN PHẢI THANH TOÁN
  items: InvoiceItem[]; // DANH SÁCH CHI TIẾT CÁC BUỔI HỌC
  bankInfo: import('./common').BankInfo; // THÔNG TIN TÀI KHOẢN NGÂN HÀNG
  qrCodeUrl: string; // ĐƯỜNG DẪN ẢNH QR CODE THANH TOÁN
  createdDate: string; // NGÀY TẠO HÓA ĐƠN
}

export interface InvoiceItem {
  date: string; // NGÀY HỌC CỦA MỤC NÀY
  description: string; // MÔ TẢ BUỔI HỌC
  sessions: number; // SỐ BUỔI
  hours: number; // SỐ GIỜ
  pricePerHour: number; // ĐƠN GIÁ
  amount: number; // THÀNH TIỀN CỦA MỤC NÀY
}

export interface DashboardStats {
  totalStudents: number; // TỔNG SỐ HỌC SINH TRONG HỆ THỐNG
  totalPaidAllTime: number; // TỔNG DOANH THU ĐÃ THU TỪ TRƯỚC ĐẾN NAY
  totalUnpaidAllTime: number; // TỔNG SỐ TIỀN CÒN NỢ CHƯA THU
  currentMonthTotal: number; // TỔNG TIỀN DỰ KIẾN CỦA THÁNG HIỆN TẠI
  currentMonthUnpaid: number; // SỐ TIỀN CHƯA THU CỦA THÁNG HIỆN TẠI
}

export interface MonthlyStats {
  month: string; // TÊN THÁNG (VÍ DỤ: "2023-10")
  totalPaid: number; // SỐ TIỀN ĐÃ THU TRONG THÁNG
  totalUnpaid: number; // SỐ TIỀN CHƯA THU TRONG THÁNG
  totalSessions: number; // TỔNG SỐ BUỔI DẠY TRONG THÁNG
}