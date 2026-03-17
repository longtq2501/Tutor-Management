import api from './axios-instance';

/** * GIAO DIỆN THÔNG TIN NGƯỜI DÙNG */
export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'TUTOR' | 'STUDENT';
  avatarUrl?: string;
  studentId?: number;
  tourCompleted?: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'TUTOR' | 'STUDENT';
}

export const authService = {
  /** * ĐĂNG NHẬP VÀO HỆ THỐNG
   * @param {Object} credentials - Chứa email và password
   * @returns {Promise<any>} Thông tin đăng nhập và bộ đôi Token
   */
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<AuthData>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /** * ĐĂNG XUẤT VÀ DỌN DẸP DỮ LIỆU PHIÊN LÀM VIỆC
   * Đảm bảo xóa sạch Token trong LocalStorage dù API có lỗi hay không
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors (e.g. 401 if already expired)
      console.warn('Logout API failed, continuing with client cleanup:', error);
    } finally {
      // LUÔN LUÔN XÓA DỮ LIỆU Ở CLIENT SAU KHI LOGOUT
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /** * LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
   * Xác thực dựa trên Access Token hiện có trong Header
   * @returns {Promise<{ success: boolean; data: UserInfo }>}
   */
  getCurrentUser: async (): Promise<ApiResponse<UserInfo>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /** * CẬP NHẬT ẢNH ĐẠI DIỆN
   * @param {File} file - File ảnh mới
   * @returns {Promise<any>}
   */
  updateAvatar: async (file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** * CẬP NHẬT THÔNG TIN CÁ NHÂN
   * @param {Object} data - Chứa fullName và các trường thanh toán
   * @returns {Promise<any>}
   */
  updateProfile: async (data: {
    fullName: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
  }): Promise<ApiResponse<UserInfo>> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  /** * ĐỔI MẬT KHẨU
   * @param {Object} data - Chứa currentPassword, newPassword, confirmPassword
   * @returns {Promise<any>}
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> => {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  /** * ĐĂNG KÝ TÀI KHOẢN MỚI
   * @param {RegisterRequest} data - Chứa email, password, fullName, role
   * @returns {Promise<ApiResponse<AuthData>>}
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthData>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};