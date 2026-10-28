import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import type { LoginUser, CreateUser, AuthResponse, User } from '../types/User';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { authActions } from '../features/authSlice';
import { authApi, type AuthToken } from '../api/authApi';

const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const USER_STORAGE_KEY = 'authUser';

function tokenValue(token: AuthToken): string {
  return typeof token === 'string' ? token : token.token;
}

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

type AuthContextType = {
  user: User | null,
  profile: User | null,
  loading: boolean,
  accessToken: string | null,
  login: (data: LoginUser) => Promise<AuthResponse>;
  register: (data: CreateUser) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: {id: "", username: "", email: "", createdAt: "", isVerified: false },
  profile: null,
  loading: false,
  accessToken: "",
  login: async () => ({ success: false, data: { user: null, accessToken: null }, message: '' }),
  register: async () => ({ success: false, data: { user: null, accessToken: null }, message: '' }),
  logout: async () => {},
});

// Context hooks are intentionally colocated with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || 'Une erreur est survenue.';
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue.';
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [loading, setLoading] = useState(() => Boolean(accessToken && !user));

  useEffect(() => {
    if (!accessToken || user) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    authApi.me()
      .then(({ data }) => {
        if (active) dispatch(authActions.setCredentials({ user: data.user, accessToken: accessToken }));
      })
      .catch(() => {
        // The axios interceptor clears the stored tokens when refresh fails.
        // Keep them when /me fails for a transient network or server error.
        if (active && !localStorage.getItem(TOKEN_STORAGE_KEY)) {
          dispatch(authActions.logout());
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, accessToken, user]);

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key === TOKEN_STORAGE_KEY) {
        if (!event.newValue) {
          dispatch(authActions.logout());
          delete axios.defaults.headers.common['Authorization'];
          return;
        }

        const storedUser = readStoredUser();
        if (storedUser) {
          dispatch(authActions.setCredentials({ user: storedUser, accessToken: event.newValue }));
          return;
        }

        authApi.me().then(({ data }) => {
          dispatch(authActions.setCredentials({ user: data.user, accessToken: event.newValue! }));
        }).catch(() => undefined);
      }

      if (event.key === USER_STORAGE_KEY && event.newValue) {
        const storedUser = readStoredUser();
        const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedUser && currentToken) {
          dispatch(authActions.setCredentials({ user: storedUser, accessToken: currentToken }));
        }
      }
    };

    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [dispatch]);

  useEffect(() => {
    const onTokenRefreshed = (event: Event) => {
      const accessToken = (event as CustomEvent<string>).detail;
      if (accessToken) dispatch(authActions.updateAccessToken(accessToken));
    };
    const onSessionExpired = () => {
      dispatch(authActions.logout());
      delete axios.defaults.headers.common['Authorization'];
    };

    window.addEventListener('auth:token-refreshed', onTokenRefreshed);
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('auth:token-refreshed', onTokenRefreshed);
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, [dispatch]);

  const login = async (data: LoginUser): Promise<AuthResponse> => {
    try {
      const response = await authApi.login(data);
      const {
        user: userData,
        accessToken: accessTokenResponse,
        refreshToken,
      } = response.data;
      const accessToken = tokenValue(accessTokenResponse);

      dispatch(authActions.setCredentials({ user: userData, accessToken }));
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokenValue(refreshToken));
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      return { success: true, data: { user: userData, accessToken }, message: 'Connexion réussie' };
    } catch (error) {
      const message = extractErrorMessage(error);
      dispatch(authActions.setError(message));
      return { success: false, data: { user: null, accessToken: null }, message };
    }
  };

  const register = async ({ username, email, password }: CreateUser): Promise<AuthResponse> => {
    console.log("Inscription dans AuthContext.............")
    try {
      const response = await authApi.register({ username: username.trim(), email: email.trim(), password });
      const { user: userData } = response.data;

      return {
        success: true,
        data: { user: userData, accessToken: null },
        message: response.data.message,
      };
    } catch (error) {
      const message = extractErrorMessage(error);
      return { success: false, data: { user: null, accessToken: null }, message };
    }
  };

  const logout = async () => {
    try {
      if (
        user?.id &&
        accessToken &&
        localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      ) {
        await authApi.logout();
      }
    } catch {
      // on logout même si l'appel échoue
    } finally {
      dispatch(authActions.logout());
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile: user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
