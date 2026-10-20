import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/User';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';
const storedAccessToken = localStorage.getItem(TOKEN_KEY);

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

const initialState: AuthState = {
  user: storedAccessToken ? readStoredUser() : null,
  accessToken: storedAccessToken,
  isAuthenticated: Boolean(storedAccessToken),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice;
