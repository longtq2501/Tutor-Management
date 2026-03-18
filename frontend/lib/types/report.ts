export interface MonthlyReportAssessmentSummary {
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface MonthlyReportSessionFeedback {
  sessionDate: string;
  feedback: string;
}

export interface MonthlyReportData {
  studentName: string;
  tutorName: string;
  month: number;
  year: number;
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  attendanceRate: number;
  totalAssessments: number;
  averageScore: number | null;
  previousMonthAvgScore: number | null;
  scoreImprovement: number | null;
  assessments: MonthlyReportAssessmentSummary[];
  sessionFeedbacks: MonthlyReportSessionFeedback[];
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | string;
  tutorComment: string;
}

export interface SaveMonthlyReportCommentRequest {
  studentId: number;
  month: number;
  year: number;
  comment: string;
}
