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
  onUpdate: (habits: Habit[]) => void
): Unsubscribe | null {
  if (!db) return null;

  const habitsRef = collection(db, 'users', userId, 'habits');
  return onSnapshot(habitsRef, (snapshot) => {
    const list: Habit[] = [];
    snapshot.forEach((d) => list.push(d.data() as Habit));
    onUpdate(list.sort((a, b) => a.order - b.order));
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore habits:', err);
  });
}

/**
 * Lắng nghe thay đổi real-time của logs:
 * Đường dẫn: users/{userId}/logs
 */
export function subscribeToLogs(
  userId: string,
  onUpdate: (logs: HabitLog[]) => void
): Unsubscribe | null {
  if (!db) return null;

  const logsRef = collection(db, 'users', userId, 'logs');
  return onSnapshot(logsRef, (snapshot) => {
    const list: HabitLog[] = [];
    snapshot.forEach((d) => list.push(d.data() as HabitLog));
    onUpdate(list);
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore logs:', err);
  });
}

/**
 * Lắng nghe thay đổi real-time của ghi chép phản tư:
 * Đường dẫn: users/{userId}/notes
 */
export function subscribeToNotes(
  userId: string,
  onUpdate: (notes: MicroNote[]) => void
): Unsubscribe | null {
  if (!db) return null;

  const notesRef = collection(db, 'users', userId, 'notes');
  return onSnapshot(notesRef, (snapshot) => {
    const list: MicroNote[] = [];
    snapshot.forEach((d) => list.push(d.data() as MicroNote));
    onUpdate(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (err) => {
    console.warn('Lỗi khi đồng bộ Firestore notes:', err);
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
 * Lưu hoặc cập nhật một thói quen lên Cloud Firestore
 */
export async function syncHabit(userId: string, habit: Habit): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'habits', habit.id);
  await setDoc(docRef, habit, { merge: true });
}

/**
 * Xóa một thói quen khỏi Cloud Firestore
 */
export async function removeHabit(userId: string, habitId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'habits', habitId);
  await deleteDoc(docRef);
}

/**
 * Lưu một bản ghi log check-in lên Firestore
 */
export async function syncLog(userId: string, log: HabitLog): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'logs', log.id);
  await setDoc(docRef, log, { merge: true });
}

/**
 * Xóa bản ghi check-in khỏi Firestore
 */
export async function removeLog(userId: string, logId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'logs', logId);
  await deleteDoc(docRef);
}

/**
 * Lưu ghi chép phản tư lên Firestore
 */
export async function syncNote(userId: string, note: MicroNote): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'notes', note.id);
  await setDoc(docRef, note, { merge: true });
}

/**
 * Xóa ghi chép phản tư khỏi Firestore
 */
export async function removeNote(userId: string, noteId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'notes', noteId);
  await deleteDoc(docRef);
}

/**
 * Lưu hồ sơ người dùng lên Firestore
 */
export async function syncProfile(userId: string, profile: UserProfile): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'profile', 'main');
  await setDoc(docRef, profile, { merge: true });
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
