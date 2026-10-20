import axiosInstance from '../axios';
import type { LoginUser, CreateUser, User } from '../types/User';

export type AuthToken =
  | string
  | {
      token: string;
      expiresAt: string;
    };

export interface LoginResponse {
  success: boolean;
  user: User;
  accessToken: AuthToken;
  refreshToken: AuthToken;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export const authApi = {
  me: () => axiosInstance.get<{ user: User }>('/users/me'),

  login: (data: LoginUser) => {
    return axiosInstance.post<LoginResponse>('/auth/login', data)
  },

  register: (data: Omit<CreateUser, 'confirm'>) => {
    return axiosInstance.post<RegisterResponse>('/auth/register', data)
  },

  logout: () =>
    axiosInstance.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post<{
      accessToken: AuthToken;
      refreshToken: AuthToken;
    }>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    axiosInstance.post('/auth/password/forgot', { email }),

  resetPassword: (token: string, newPassword: string) =>
    axiosInstance.post('/auth/password/reset', { token, newPassword }),

  verifyCode: (userId: string, code: string) =>
    axiosInstance.post('/auth/password/verify-reset-code', { userId, code }),

  unLockedUser: (userId: string) => 
    axiosInstance.post(`/auth/unlock/${userId}`),
};
