// src/lib/types.ts
export interface Student {
    id: number;
    name: string;
    phone?: string;
    schedule: string;
    pricePerHour: number;
    notes?: string;
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
  }
  
  // export interface SessionRecordRequest {
  //   studentId: number;
  //   month: string;
  //   sessions: number;
  //   hoursPerSession: number; // Thêm field này
  //   notes?: string;
  // }
  
  // export interface SessionRecord {
  //   id: number;
  //   studentId: number;
  //   studentName: string;
  //   month: string;
  //   sessions: number;
  //   hours: number;
  //   pricePerHour: number;
  //   totalAmount: number;
  //   paid: boolean;
  //   paidAt?: string;
  //   notes?: string;
  //   createdAt: string;
  // }

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
    sessionDate: string; // 🆕 YYYY-MM-DD
    createdAt: string;
  }
  
  export interface SessionRecordRequest {
    studentId: number;
    month: string;
    sessions: number;
    sessionDate: string; // 🆕 YYYY-MM-DD
    notes?: string;
  }
  
  // export interface SessionRecordRequest {
  //   studentId: number;
  //   month: string;
  //   sessions: number;
  //   notes?: string;
  // }
  
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