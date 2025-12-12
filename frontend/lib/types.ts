// src/lib/types.ts
export interface Student {
  id: number;
  name: string;
  phone?: string;
  schedule: string;
  pricePerHour: number;
  notes?: string;
  active: boolean;
  startMonth: string;
  lastActiveMonth?: string;
  monthsLearned?: number;
  learningDuration?: string;
  createdAt: string;
  totalPaid: number;
  totalUnpaid: number;
}

export interface StudentRequest {
  name: string;
  phone?: string;
  schedule: string;
  pricePerHour: number;
  notes?: string;
  active?: boolean;
  startMonth?: string;
}

export interface SessionRecord {
  id: number;
  studentId: number;
  studentName: string;
  month: string;
  sessions: number;
  hours: number;
  pricePerHour: number;
  totalAmount: number;
  paid: boolean;
  paidAt?: string;
  notes?: string;
  sessionDate: string;
  hoursPerSession: number;
  createdAt: string;
}

export interface SessionRecordRequest {
  studentId: number;
  month: string;
  sessions: number;
  sessionDate: string;
  hoursPerSession: number;
  notes?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalPaidAllTime: number;
  totalUnpaidAllTime: number;
  currentMonthTotal: number;
  currentMonthUnpaid: number;
}

export interface MonthlyStats {
  month: string;
  totalPaid: number;
  totalUnpaid: number;
  totalSessions: number;
}

// export interface InvoiceRequest {
//   studentId?: number; // Optional - nếu không có thì là báo giá tổng
//   month: string;
//   sessionRecordIds?: number[];
//   allStudents?: boolean; // True nếu muốn tạo báo giá cho tất cả học sinh
// }

// api.ts - thêm field vào InvoiceRequest interface
export interface InvoiceRequest {
  studentId?: number;
  month: string;
  sessionRecordIds?: number[];
  allStudents?: boolean;
  multipleStudents?: boolean; // NEW
  selectedStudentIds?: number[]; // NEW
}

export interface InvoiceResponse {
  invoiceNumber: string;
  studentName: string;
  month: string;
  totalSessions: number;
  totalHours: number;
  totalAmount: number;
  items: InvoiceItem[];
  bankInfo: BankInfo;
  qrCodeUrl: string;
  createdDate: string;
}

export interface InvoiceItem {
  date: string;
  description: string;
  sessions: number;
  hours: number;
  pricePerHour: number;
  amount: number;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode: string;
}

export type DocumentCategory = 
  | 'GRAMMAR' | 'VOCABULARY' | 'READING' | 'LISTENING'
  | 'SPEAKING' | 'WRITING' | 'EXERCISES' | 'EXAM'
  | 'PET' | 'FCE' | 'IELTS' | 'TOEIC' | 'OTHER';

export interface Document {
  id: number;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  category: DocumentCategory;
  categoryDisplayName: string;
  description?: string;
  studentId?: number;
  studentName?: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  formattedFileSize: string;
}

export interface DocumentUploadRequest {
  title: string;
  category: DocumentCategory;
  description?: string;
  studentId?: number;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  formattedTotalSize: string;
  totalDownloads: number;
  categoryStats: {
    grammar: number;
    vocabulary: number;
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
    exercises: number;
    exam: number;
    pet: number;
    fce: number;
    ielts: number;
    toeic: number;
    other: number;
  };
}