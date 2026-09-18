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
    // Provider đăng nhập chuẩn chỉ yêu cầu hồ sơ cơ bản (Email, Tên, Avatar) - không đòi hỏi Google Drive
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Kích hoạt IndexedDB Persistent Cache cho Firestore để hỗ trợ Offline-First
    // ignoreUndefinedProperties: true để bỏ qua các trường tùy chọn mang giá trị undefined thay vì throw exception
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      ignoreUndefinedProperties: true
    });
    console.info('[Atomic Growth] Firebase & Cloud Firestore đã khởi tạo thành công với Offline Cache.');
  } catch (err) {
    console.warn('[Atomic Growth] Lỗi khi kết nối Firebase, tự động chuyển về chế độ Local Storage:', err);
  }
} else {
  console.info('[Atomic Growth] Chế độ Offline Mock Mode đang hoạt động (chưa cấu hình Firebase API Key trong .env).');
}

// Khóa lưu trữ token và thời điểm cấp quyền trong LocalStorage
const DRIVE_TOKEN_KEY = 'atomic_google_drive_token';
const DRIVE_TOKEN_SAVED_AT = 'atomic_google_drive_token_saved_at';
// OAuth Access Token của Google hết hạn sau 60 phút (3600s). Ta đặt ngưỡng an toàn 50 phút (3000s).
const DRIVE_TOKEN_TTL_MS = 50 * 60 * 1000;

/**
 * Lưu Access Token Google Drive kèm mốc thời gian
 */
export function setStoredDriveToken(token: string): void {
  localStorage.setItem(DRIVE_TOKEN_KEY, token);
  localStorage.setItem(DRIVE_TOKEN_SAVED_AT, Date.now().toString());
}

/**
 * Xóa vĩnh viễn Access Token Google Drive khỏi bộ nhớ cục bộ
 */
export function clearStoredDriveToken(): void {
  localStorage.removeItem(DRIVE_TOKEN_KEY);
  localStorage.removeItem(DRIVE_TOKEN_SAVED_AT);
}

/**
 * Lấy Access Token Google Drive đã lưu, tự động dọn dẹp nếu token đã quá hạn 50 phút
 */
export function getStoredDriveToken(): string | null {
  const token = localStorage.getItem(DRIVE_TOKEN_KEY);
  const savedAtStr = localStorage.getItem(DRIVE_TOKEN_SAVED_AT);
  if (!token) return null;

  if (savedAtStr) {
    const savedAt = parseInt(savedAtStr, 10);
    if (!isNaN(savedAt) && Date.now() - savedAt > DRIVE_TOKEN_TTL_MS) {
      console.info('[Atomic Growth] Google Drive token đã hết hạn bảo mật (TTL > 50 phút). Tự động dọn dẹp.');
      clearStoredDriveToken();
      return null;
    }
  }

  return token;
}

/**
 * Đăng nhập bằng tài khoản Google (Pop-up nhanh, chỉ cần quyền hồ sơ cơ bản)
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase chưa được cấu hình. Vui lòng bổ sung biến môi trường trong file .env');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
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
  driveProvider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      setStoredDriveToken(token);
      return token;
    }
    throw new Error('Không nhận được mã truy cập OAuth từ Google');
  } catch (error) {
    console.error('Lỗi khi xin quyền Google Drive:', error);
    throw error;
  }
}

/**
 * Đăng xuất khỏi tài khoản hiện tại và xóa token Drive
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  try {
    clearStoredDriveToken();
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
