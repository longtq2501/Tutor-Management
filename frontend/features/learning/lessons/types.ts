/**
 * LessonImageDTO - Hình ảnh đính kèm trong bài giảng
 * Backend: LessonImageDTO.java
 */
export interface LessonImageDTO {
  id?: number;
  imageUrl: string; // @NotBlank
  caption?: string;
  displayOrder?: number;
}

/**
 * LessonCategoryDTO - Danh mục bài giảng
 */
export interface LessonCategoryDTO {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * LessonCategoryRequest - Yêu cầu tạo/cập nhật danh mục
 */
export interface LessonCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

/**
 * LessonResourceDTO - Tài liệu đính kèm
 * Backend: LessonResourceDTO.java
 */
export interface LessonResourceDTO {
  id?: number;
  resourceName: string; // @NotBlank
  resourceUrl: string; // @NotBlank
  resourceType?: string; // PDF, DOCX, etc.
  fileSize?: number;
}

/**
 * LessonDTO - DTO chính cho bài giảng
 * Backend: LessonDTO.java
 */
export interface LessonDTO {
  id: number;
  tutorName: string; // @NotBlank
  title: string; // @NotBlank
  summary?: string;
  content: string; // @NotBlank - HTML content
  lessonDate: string; // LocalDate format: YYYY-MM-DD
  videoUrl?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  isLibrary: boolean;
  assignedStudentCount?: number;
  totalViewCount?: number;
  completionRate?: number;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  category?: LessonCategoryDTO;
  createdAt: string; // LocalDateTime - ISO 8601
  updatedAt: string; // LocalDateTime - ISO 8601
}

/**
 * CreateLessonRequest - Request để tạo bài giảng mới
 * Backend: CreateLessonRequest.java
 */
export interface CreateLessonRequest {
  studentIds?: number[]; // Optional - List<Long>
  tutorName: string; // @NotBlank
  title: string; // @NotBlank
  summary?: string;
  content: string; // @NotBlank
  lessonDate: string; // LocalDate format: YYYY-MM-DD
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  isPublished: boolean;
  categoryId?: number;
}

/**
 * UpdateLessonRequest - Request để cập nhật bài giảng
 * Backend: UpdateLessonRequest.java
 */
export interface UpdateLessonRequest {
  tutorName: string; // @NotBlank
  title: string; // @NotBlank
  summary?: string;
  content: string; // @NotBlank
  lessonDate: string; // LocalDate format: YYYY-MM-DD
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  isPublished: boolean;
  categoryId?: number;
}

/**
 * CreateLibraryLessonRequest - Tạo bài giảng vào kho
 * Backend: Tương tự CreateLessonRequest nhưng không có studentIds
 */
export interface CreateLibraryLessonRequest {
  tutorName: string;
  title: string;
  summary?: string;
  content: string;
  lessonDate?: string; // Optional cho library
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  isPublished?: boolean; // Default false cho library
  categoryId?: number;
}

/**
 * AssignLessonRequest - Giao/Thu hồi bài giảng
 * Backend: AssignLessonRequest.java
 */
export interface AssignLessonRequest {
  studentIds: number[]; // List<Long>
}

/**
 * StudentAssignmentDTO - Thông tin học sinh được giao bài
 * Backend: StudentAssignmentDTO.java hoặc tương đương
 */
export interface StudentAssignmentDTO {
  studentId: number;
  studentName: string;
  email?: string;
  assignedAt: string; // LocalDateTime
  completed?: boolean;
  completedAt?: string;
}

/**
 * LessonLibraryDTO - DTO cho bài giảng trong kho
 * Backend: LessonLibraryDTO.java hoặc sử dụng LessonDTO với isLibrary=true
 */
export interface LessonLibraryDTO {
  id: number;
  tutorName: string;
  title: string;
  summary?: string;
  content: string;
  lessonDate?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  assignedStudentCount?: number;
  category?: LessonCategoryDTO;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLessonDTO extends LessonDTO {
  tutorName: string;
  assignedStudentCount?: number;
}

// ============================================================================
// UI-SPECIFIC TYPES (Frontend only)
// ============================================================================

export interface LessonFormData {
  tutorName: string;
  title: string;
  summary?: string;
  content: string;
  lessonDate?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  images?: LessonImageDTO[];
  resources?: LessonResourceDTO[];
  isPublished?: boolean;
  studentIds?: number[];
  categoryId?: number;
}

export type LessonFormMode = 'create' | 'edit' | 'library';

export interface Student {
  id: number;
  name: string;
  email?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Format date to YYYY-MM-DD for Backend
 */
export const formatDateForBackend = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Parse Backend date string to Date object
 */
export const parseDateFromBackend = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  return new Date(dateStr);
};