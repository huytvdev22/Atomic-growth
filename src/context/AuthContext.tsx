import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  isFirebaseConfigured,
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  getStoredDriveToken,
  clearStoredDriveToken,
  requestGoogleDriveAccess
} from '../services/firebase';
import { habitStorage } from '../services/habitStorage';
import { toast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticating: boolean;
  isGuestMode: boolean;
  setGuestMode: (enabled: boolean) => void;
  isConfigured: boolean;
  driveToken: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  requestDriveAccess: () => Promise<string>;
  clearDriveToken: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGuestMode, setIsGuestModeState] = useState<boolean>(() => habitStorage.isGuestMode());
  const [driveToken, setDriveToken] = useState<string | null>(() => getStoredDriveToken());
  const isConfigured = useMemo(() => isFirebaseConfigured(), []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Khi đã đăng nhập Google thành công, hủy bỏ cờ guest mode
        habitStorage.setGuestMode(false);
        setIsGuestModeState(false);
      }
      setDriveToken(getStoredDriveToken());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const setGuestMode = useCallback((enabled: boolean) => {
    habitStorage.setGuestMode(enabled);
    setIsGuestModeState(enabled);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
      // Sau khi đăng nhập xong, tắt guest mode
      habitStorage.setGuestMode(false);
      setIsGuestModeState(false);
      toast.success('Đăng nhập thành công', 'Chào mừng bạn quay trở lại với Atomic Growth!');
    } catch (err: any) {
      // Nếu người dùng chỉ đơn giản là tắt popup hoặc mở popup mới đè lên, không quăng lỗi crash
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.info('[Auth] Popup đăng nhập đã được đóng bởi người dùng.');
        return;
      }
      console.error('Đăng nhập Google thất bại:', err);
      toast.error('Đăng nhập thất bại', err?.message || 'Không thể hoàn tất đăng nhập tài khoản Google.');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  const requestDriveAccess = useCallback(async () => {
    try {
      const token = await requestGoogleDriveAccess();
      setDriveToken(token);
      return token;
    } catch (err) {
      console.error('Lỗi khi xin quyền truy cập Google Drive:', err);
      throw err;
    }
  }, []);

  const clearDriveToken = useCallback(() => {
    clearStoredDriveToken();
    setDriveToken(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
      clearStoredDriveToken();
      setDriveToken(null);
      // Khi đăng xuất, trở về trạng thái đón tiếp (không tự động ở guest mode)
      habitStorage.setGuestMode(false);
      setIsGuestModeState(false);
      toast.info('Đã đăng xuất', 'Phiên làm việc đã kết thúc an toàn.');
    } catch (err) {
      console.error('Đăng xuất thất bại:', err);
      toast.error('Đăng xuất thất bại', 'Không thể hoàn tất đăng xuất tài khoản.');
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticating,
      isGuestMode,
      setGuestMode,
      isConfigured,
      driveToken,
      loginWithGoogle,
      logout,
      requestDriveAccess,
      clearDriveToken
    }),
    [
      user,
      loading,
      isAuthenticating,
      isGuestMode,
      setGuestMode,
      isConfigured,
      driveToken,
      loginWithGoogle,
      logout,
      requestDriveAccess,
      clearDriveToken
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

