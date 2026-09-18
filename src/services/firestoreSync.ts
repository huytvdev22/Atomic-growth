import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitLog, UserProfile, MicroNote } from '../types/habit';
import { DEFAULT_PROFILE } from './habitStorage';

/**
 * Lắng nghe thay đổi real-time của thói quen trong Cloud Firestore:
 * Đường dẫn: users/{userId}/habits
 */
export function subscribeToHabits(
  userId: string,
  onUpdate: (habits: Habit[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe | null {
  if (!db) {
    onUpdate([]);
    return null;
  }

  const habitsRef = collection(db, 'users', userId, 'habits');
  return onSnapshot(habitsRef, (snapshot) => {
    const list: Habit[] = [];
    snapshot.forEach((d) => list.push(d.data() as Habit));
    onUpdate(list.sort((a, b) => a.order - b.order));
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore habits:', err);
    if (onError) {
      onError(err);
    } else {
      onUpdate([]);
    }
  });
}

/**
 * Lắng nghe thay đổi real-time của logs:
 * Đường dẫn: users/{userId}/logs
 */
export function subscribeToLogs(
  userId: string,
  onUpdate: (logs: HabitLog[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe | null {
  if (!db) {
    onUpdate([]);
    return null;
  }

  const logsRef = collection(db, 'users', userId, 'logs');
  return onSnapshot(logsRef, (snapshot) => {
    const list: HabitLog[] = [];
    snapshot.forEach((d) => list.push(d.data() as HabitLog));
    onUpdate(list);
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore logs:', err);
    if (onError) {
      onError(err);
    } else {
      onUpdate([]);
    }
  });
}

/**
 * Lắng nghe thay đổi real-time của ghi chép phản tư:
 * Đường dẫn: users/{userId}/notes
 */
export function subscribeToNotes(
  userId: string,
  onUpdate: (notes: MicroNote[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe | null {
  if (!db) {
    onUpdate([]);
    return null;
  }

  const notesRef = collection(db, 'users', userId, 'notes');
  return onSnapshot(notesRef, (snapshot) => {
    const list: MicroNote[] = [];
    snapshot.forEach((d) => list.push(d.data() as MicroNote));
    onUpdate(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore notes:', err);
    if (onError) {
      onError(err);
    } else {
      onUpdate([]);
    }
  });
}

/**
 * Lắng nghe thay đổi hồ sơ người dùng từ Cloud Firestore
 * Đường dẫn: users/{userId}/profile/main
 */
export function subscribeToProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void
): Unsubscribe | null {
  if (!db) return null;

  const profileRef = doc(db, 'users', userId, 'profile', 'main');
  return onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as UserProfile);
    }
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore profile:', err);
  });
}

/**
 * Loại bỏ các thuộc tính mang giá trị undefined khỏi object trước khi gửi lên Cloud Firestore.
 * Giúp dữ liệu an toàn tuyệt đối, tránh lỗi "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Lưu hoặc cập nhật một thói quen lên Cloud Firestore
 */
export async function syncHabit(userId: string, habit: Habit): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'habits', habit.id);
    const sanitizedData = sanitizeForFirestore(habit);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi lưu thói quen ${habit.id} lên Firestore:`, err);
    throw err;
  }
}

/**
 * Xóa một thói quen khỏi Cloud Firestore
 */
export async function removeHabit(userId: string, habitId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'habits', habitId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi xóa thói quen ${habitId} khỏi Firestore:`, err);
    throw err;
  }
}

/**
 * Lưu một bản ghi log check-in lên Firestore
 */
export async function syncLog(userId: string, log: HabitLog): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'logs', log.id);
    const sanitizedData = sanitizeForFirestore(log);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi lưu log check-in ${log.id} lên Firestore:`, err);
    throw err;
  }
}

/**
 * Xóa bản ghi check-in khỏi Firestore
 */
export async function removeLog(userId: string, logId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'logs', logId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi xóa log ${logId} khỏi Firestore:`, err);
    throw err;
  }
}

/**
 * Lưu ghi chép phản tư lên Firestore
 */
export async function syncNote(userId: string, note: MicroNote): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'notes', note.id);
    const sanitizedData = sanitizeForFirestore(note);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi lưu note ${note.id} lên Firestore:`, err);
    throw err;
  }
}

/**
 * Xóa ghi chép phản tư khỏi Firestore
 */
export async function removeNote(userId: string, noteId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi xóa note ${noteId} khỏi Firestore:`, err);
    throw err;
  }
}

/**
 * Lưu hồ sơ người dùng lên Firestore
 */
export async function syncProfile(userId: string, profile: UserProfile): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'main');
    const sanitizedData = sanitizeForFirestore(profile);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.error(`[firestoreSync] Lỗi khi lưu profile lên Firestore:`, err);
    throw err;
  }
}

/**
 * Khởi tạo hồ sơ ban đầu cho tài khoản mới (Clean Slate - không tự ý inject mock habits/logs)
 */
export async function seedUserDataIfEmpty(userId: string, userName?: string): Promise<void> {
  if (!db) return;
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'main');
    const snap = await getDoc(profileRef);

    if (!snap.exists()) {
      console.info('[Atomic Growth] Khởi tạo hồ sơ người dùng mới trên Firestore (Clean Slate).');
      const cleanProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        id: userId,
        name: userName || DEFAULT_PROFILE.name,
        coreIdentityStatement: 'Tôi là người kiên trì phát triển bản thân 1% mỗi ngày.'
      };
      await syncProfile(userId, cleanProfile);
    }
  } catch (err) {
    console.warn('Lỗi khi kiểm tra hồ sơ khởi đầu Firestore:', err);
  }
}
