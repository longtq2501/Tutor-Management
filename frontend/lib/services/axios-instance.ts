// frontend/lib/services/axios-instance.ts
import axios from 'axios';

/** * CẤU HÌNH ĐƯỜNG DẪN API CƠ SỞ (BASE URL)
 * Tự động làm sạch dấu "/" thừa và đảm bảo luôn có hậu tố "/api"
 */
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');
const API_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

/** * KHỞI TẠO ĐỐI TƯỢNG AXIOS
 * Thiết lập cấu hình mặc định cho mọi Request gửi đi
 */
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

/** * INTERCEPTOR CHO REQUEST - TỰ ĐỘNG ĐÍNH KÈM TOKEN
 * Kiểm tra và thêm Bearer Token vào Header trước khi gửi yêu cầu lên Server
 */
api.interceptors.request.use(
  (config) => {
    // KHÔNG ĐÍNH KÈM TOKEN VỚI CÁC API PUBLIC (LOGIN/REGISTER/REFRESH)
    const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/refresh-token'];
    if (config.url && publicAuthPaths.some(path => config.url?.includes(path))) {
      return config;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/** * INTERCEPTOR CHO RESPONSE - XỬ LÝ LỖI VÀ REFRESH TOKEN TỰ ĐỘNG
 * Lắng nghe phản hồi từ Server, nếu gặp lỗi 401 (Hết hạn Token) sẽ tự động làm mới
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthPath = originalRequest.url && ['/auth/login', '/auth/register', '/auth/refresh-token'].some(path => originalRequest.url.includes(path));

    // KIỂM TRA NẾU LỖI LÀ 401 (UNAUTHORIZED), CHƯA THỬ LẠI VÀ KHÔNG PHẢI API AUTH
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        /** * THỰC HIỆN GỌI API LÀM MỚI TOKEN (REFRESH TOKEN) */
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        }, {
          withCredentials: true
        });

        // LẤY ACCESS TOKEN MỚI VÀ LƯU VÀO STORAGE
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // CẬP NHẬT HEADER VÀ THỰC HIỆN LẠI REQUEST BAN ĐẦU
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        /** * XỬ LÝ KHI REFRESH TOKEN CŨNG HẾT HẠN - ĐĂNG XUẤT NGƯỜI DÙNG */
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Chỉ redirect nếu không ở trang login để tránh lặp vô tận
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;