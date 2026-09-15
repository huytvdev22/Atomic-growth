import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore
} from 'firebase/firestore';

// Cấu hình Firebase lấy từ biến môi trường Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Kiểm tra xem Firebase đã được cung cấp API Key hợp lệ hay chưa
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Kích hoạt IndexedDB Persistent Cache cho Firestore để hỗ trợ Offline-First
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.info('[Atomic Growth] Firebase & Cloud Firestore đã khởi tạo thành công với Offline Cache.');
  } catch (err) {
    console.warn('[Atomic Growth] Lỗi khi kết nối Firebase, tự động chuyển về chế độ Local Storage:', err);
  }
} else {
  console.info('[Atomic Growth] Chế độ Offline Mock Mode đang hoạt động (chưa cấu hình Firebase API Key trong .env).');
}

/**
 * Đăng nhập bằng tài khoản Google (Pop-up) kèm theo Scope Google Drive
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase chưa được cấu hình. Vui lòng bổ sung biến môi trường trong file .env');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      localStorage.setItem('atomic_google_drive_token', credential.accessToken);
    }
    return result.user;
  } catch (error) {
    console.error('Lỗi khi đăng nhập bằng Google:', error);
    throw error;
  }
}

/**
 * Yêu cầu hoặc làm mới quyền truy cập Google Drive (OAuth Access Token)
 */
export async function requestGoogleDriveAccess(): Promise<string> {
  if (!auth) {
    throw new Error('Firebase Auth chưa được khởi tạo');
  }

  const driveProvider = new GoogleAuthProvider();
  driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
  driveProvider.setCustomParameters({ prompt: 'consent' });

  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem('atomic_google_drive_token', token);
      return token;
    }
    throw new Error('Không nhận được mã truy cập OAuth từ Google');
  } catch (error) {
    console.error('Lỗi khi xin quyền Google Drive:', error);
    throw error;
  }
}

/**
 * Lấy Access Token Google Drive đã lưu
 */
export function getStoredDriveToken(): string | null {
  return localStorage.getItem('atomic_google_drive_token');
}

/**
 * Đăng xuất khỏi tài khoản hiện tại
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    throw error;
  }
}

/**
 * Lắng nghe thay đổi trạng thái xác thực người dùng
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { app, auth, db, googleProvider };
