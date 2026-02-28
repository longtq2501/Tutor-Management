'use client';

import { authService, type UserInfo } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateProfile: (data: { fullName: string }) => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: 'ADMIN' | 'TUTOR' | 'STUDENT') => boolean;
  hasAnyRole: (roles: Array<'ADMIN' | 'TUTOR' | 'STUDENT'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        // Validate storedUser before parsing
        if (accessToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseError) {
            // Invalid JSON in localStorage, clear it
            console.warn('Invalid user data in localStorage, clearing...');
            localStorage.removeItem('user');
          }

          // Verify token is still valid (optional optimization: check if we actually need to fetch it)
          try {
            const response = await authService.getCurrentUser();
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } catch {
            // Token invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      localStorage.setItem('accessToken', token);
      document.cookie = `accessToken=${token}; path=/; max-age=604800; samesite=lax`;

      const response = await authService.getCurrentUser();
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `userRole=${userData.role}; path=/; max-age=604800; samesite=lax`;
      setUser(userData);

      if (userData.role === 'ADMIN') {
        router.push('/overview');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error logging in with token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Xác thực thất bại';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; samesite=lax`;
      document.cookie = `userRole=${userData.role}; path=/; max-age=604800; samesite=lax`;

      setUser(userData);

      // Redirect to dashboard
      if (userData.role === 'ADMIN') {
        router.push('/overview');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorData = (error as any).response?.data;
      const message = errorData?.message || 'Đăng nhập thất bại';
      throw new Error(message);
    }
  }, [router]);


  const updateAvatar = useCallback(async (file: File) => {
    try {
      const response = await authService.updateAvatar(file);
      const newAvatarUrl = response.data;

      if (user) {
        const updatedUser = { ...user, avatarUrl: newAvatarUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: unknown) {
      console.error('Update avatar error:', error);
      const errorData = (error as any).response?.data;
      const message = errorData?.message || 'Cập nhật ảnh đại diện thất bại';
      throw new Error(message);
    }
  }, [user]);

  const updateProfile = useCallback(async (data: { fullName: string }) => {
    try {
      const response = await authService.updateProfile(data);
      const updatedData = response.data;

      if (user) {
        const updatedUser = { ...user, fullName: updatedData.fullName };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      const errorData = (error as any).response?.data;

      let message = errorData?.message || 'Cập nhật thông tin thất bại';

      // Handle validation errors if present
      if (errorData?.data && typeof errorData.data === 'object') {
        const validationErrors = Object.values(errorData.data).join(', ');
        if (validationErrors) message = `${message}: ${validationErrors}`;
      }

      throw new Error(message);
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear all React Query cache to prevent stale data between sessions
      queryClient.clear();

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      setUser(null);
      router.push('/login');
    }
  }, [router, queryClient]);


  const hasRole = useCallback((role: 'ADMIN' | 'TUTOR' | 'STUDENT'): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: Array<'ADMIN' | 'TUTOR' | 'STUDENT'>): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithToken,
        logout,
        updateAvatar,
        updateProfile,
        isAuthenticated: !!user,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}