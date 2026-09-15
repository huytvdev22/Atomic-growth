import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface VersionInfo {
  version: string;
  buildTime?: string;
  name?: string;
  releaseNotes?: string;
}

export interface UpdateContextType {
  currentVersion: string;
  latestVersion: string | null;
  releaseNotes: string | null;
  hasUpdate: boolean;
  isChecking: boolean;
  statusMessage: string | null;
  checkForUpdate: () => Promise<void>;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

const CURRENT_APP_VERSION = '1.0.0';

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Khởi tạo Service Worker với callback xử lý
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.info('[Atomic Growth PWA] Service Worker đã đăng ký thành công:', registration);
      // Thiết lập định kỳ kiểm tra bản mới mỗi 60 phút
      if (registration) {
        setInterval(() => {
          registration.update().catch((err) => console.warn('Lỗi auto-check SW:', err));
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[Atomic Growth PWA] Lỗi khi đăng ký Service Worker:', error);
    },
  });

  // Khi Service Worker báo hiệu có bundle mới sẵn sàng (waiting)
  useEffect(() => {
    if (needRefresh) {
      setHasUpdate(true);
    }
  }, [needRefresh]);

  /**
   * Kiểm tra bản cập nhật thủ công (khi người dùng bấm vào version badge trên Sidebar)
   */
  const checkForUpdate = useCallback(async () => {
    setIsChecking(true);
    setStatusMessage('Đang kiểm tra phiên bản mới...');

    try {
      // 1. Kích hoạt Service Worker kiểm tra file mới
      let swWaiting = false;
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            swWaiting = true;
          }
        }
      }

      // 2. Tải file version.json với no-cache để đọc release notes và version tag mới nhất
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });

      let serverVersion: string | null = null;
      let notes: string | null = null;

      if (res.ok) {
        const data: VersionInfo = await res.json();
        serverVersion = data.version;
        notes = data.releaseNotes || null;
        if (serverVersion && serverVersion !== CURRENT_APP_VERSION) {
          setLatestVersion(serverVersion);
          setReleaseNotes(notes);
          setHasUpdate(true);
        }
      }

      // 3. Phản hồi kết quả sau hiệu ứng loading nhẹ nhàng
      setTimeout(() => {
        setIsChecking(false);
        if (swWaiting || needRefresh || (serverVersion && serverVersion !== CURRENT_APP_VERSION)) {
          setHasUpdate(true);
          setStatusMessage(`Đã có phiên bản mới (${serverVersion || 'Mới'})!`);
        } else {
          setStatusMessage(`Bạn đang dùng bản mới nhất (v${CURRENT_APP_VERSION})`);
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }, 600);
    } catch (err) {
      console.warn('[Atomic Growth PWA] Lỗi khi kiểm tra cập nhật:', err);
      setIsChecking(false);
      setStatusMessage('Không thể kết nối máy chủ để kiểm tra.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }, [needRefresh]);

  /**
   * Kích hoạt Service Worker skipWaiting() và làm mới ứng dụng
   */
  const applyUpdate = useCallback(() => {
    try {
      updateServiceWorker(true);
    } catch (err) {
      console.warn('Lỗi khi áp dụng cập nhật:', err);
      // Fallback reload cứng
      window.location.reload();
    }
  }, [updateServiceWorker]);

  /**
   * Đóng thông báo cập nhật
   */
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  return (
    <UpdateContext.Provider
      value={{
        currentVersion: CURRENT_APP_VERSION,
        latestVersion,
        releaseNotes,
        hasUpdate: hasUpdate || needRefresh,
        isChecking,
        statusMessage,
        checkForUpdate,
        applyUpdate,
        dismissUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useAppUpdate = (): UpdateContextType => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useAppUpdate phải được sử dụng bên trong UpdateProvider');
  }
  return context;
};
