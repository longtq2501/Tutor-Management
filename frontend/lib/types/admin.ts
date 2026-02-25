import { Document as DocumentType } from './document';
import { Student } from './student';


export interface OverviewStats {
    totalTutors: number;
    activeTutors: number;
    inactiveTutors: number;
    suspendedTutors: number;
    totalStudents: number;
    activeStudents: number;
    totalRevenueThisMonth: string;
    totalRevenueAllTime: string;
    totalRevenue: number;
    totalSessions: number;
    proAccounts: number;
    freeAccounts: number;
    pendingIssues: number;
}

export interface MonthlyRevenue {
    month: string;
    totalRevenue: number;
}

export interface ActivityLog {
    id: number;
    type: string;
    actorName: string;
    actorRole: string;
    description: string;
    createdAt: string;
}

export interface AuditLog {
    id: number;
    action: string;
    actorEmail: string;
    actorRole: string;
    resourceType: string;
    resourceId?: string;
    timestamp: string;
    status: string;
}

export interface AdminStudent extends Student {
    tutorId: number;
    tutorName: string;
    totalDebt: number;
}

export interface AdminDocument extends DocumentType {
    tutorId: number;
    tutorName: string;
    folderId?: number;
    folderName?: string;
}

export interface AdminFolder {
    id: number;
    name: string;
    parentId?: number;
    documentCount: number;
    createdAt: string;
}

export interface AdminDocumentStats {
    totalDocuments: number;
    totalDownloads: number;
    totalStorageMB: number;
}

export interface StudentGrowth {
    month: string;
    count: number;
}

export interface TopTutor {
    tutorId: number;
    tutorName: string;
    totalRevenue: number;
    sessionCount: number;
}

export interface Role {
    id: number;
    name: string;
    permissions: string[];
}

export interface ManagedUser {
    id: number;
    email: string;
    fullName: string;
    role: Role | string;
    enabled: boolean;
    createdAt: string;
}
