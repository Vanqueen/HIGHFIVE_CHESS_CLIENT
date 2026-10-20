export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  accountStatus?: string;
  connectionStatus?: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  deletedAt?: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
  confirm?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  success: boolean;
  data: { user: User | null; accessToken: string | null };
  message: string;
}

export interface Socket {
  id?: string;
  user: User;
  socket: string;
  connected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_draw: number;
  status: string;
  created_at: string;
  updated_at?: string;
};
