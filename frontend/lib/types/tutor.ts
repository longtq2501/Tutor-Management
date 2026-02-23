export interface Tutor {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  studentCount: number; // For list view projection
  createdAt: string;
  avatarUrl?: string;
}

export interface TutorRequest {
  userId?: number;
  fullName: string;
  email: string;
  password?: string; // Required for create
  phone: string;
  subscriptionPlan: string;
  subscriptionStatus?: string;
}

export interface TutorStats {
  studentCount: number;
  sessionCount: number;
  totalRevenue: number;
}