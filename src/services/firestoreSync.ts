import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitLog, UserProfile, MicroNote } from '../types/habit';
import { INITIAL_HABITS, DEFAULT_PROFILE, INITIAL_NOTES } from './habitStorage';

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
 * Khởi tạo dữ liệu mẫu lần đầu nếu tài khoản mới chưa có thói quen nào
 */
export async function seedUserDataIfEmpty(userId: string): Promise<void> {
  if (!db) return;
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const q = query(habitsRef);
    const snap = await getDocs(q);

    if (snap.empty) {
      console.info('[Atomic Growth] Khởi tạo dữ liệu thói quen ban đầu trên Firestore cho người dùng mới.');
      for (const h of INITIAL_HABITS) {
        await syncHabit(userId, h);
      }
      for (const n of INITIAL_NOTES) {
        await syncNote(userId, n);
      }
      await syncProfile(userId, { ...DEFAULT_PROFILE, id: userId });
    }
  } catch (err) {
    console.warn('Lỗi khi kiểm tra dữ liệu khởi đầu Firestore:', err);
  }
}
