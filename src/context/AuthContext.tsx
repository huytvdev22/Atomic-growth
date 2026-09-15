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

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  const [driveToken, setDriveToken] = useState<string | null>(() => getStoredDriveToken());
  const isConfigured = useMemo(() => isFirebaseConfigured(), []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setDriveToken(getStoredDriveToken());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
      setDriveToken(getStoredDriveToken());
    } catch (err) {
      console.error('Đăng nhập Google thất bại:', err);
      throw err;
    }
  }, []);

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
    } catch (err) {
      console.error('Đăng xuất thất bại:', err);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured,
      driveToken,
      loginWithGoogle,
      logout,
      requestDriveAccess,
      clearDriveToken
    }),
    [user, loading, isConfigured, driveToken, loginWithGoogle, logout, requestDriveAccess, clearDriveToken]
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
