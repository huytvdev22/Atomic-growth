import { Habit, HabitLog, UserProfile, MicroNote } from '../types/habit';

const STORAGE_KEYS = {
  HABITS: 'atomic_growth_habits',
  LOGS: 'atomic_growth_logs',
  PROFILE: 'atomic_growth_profile',
  NOTES: 'atomic_growth_notes',
  GUEST_MODE: 'atomic_growth_guest_mode'
};

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'Bạn',
  coreIdentityStatement: 'Tôi là người kiên trì phát triển bản thân 1% mỗi ngày.',
  streakTargetDays: 30,
  soundEnabled: true,
  vibrationEnabled: true
};

/**
 * Tự động loại bỏ dữ liệu demo/mock cũ (như habit-1, habit-2, các thói quen "Uống 500ml...")
 * khỏi LocalStorage của trình duyệt, đảm bảo tài khoản luôn ở trạng thái Clean Slate 100%.
 */
export function cleanLegacyDemoData(): void {
  try {
    // 1. Dọn dẹp thói quen demo cũ
    const rawHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (rawHabits) {
      const parsed = JSON.parse(rawHabits);
      if (Array.isArray(parsed)) {
        const legacyHabitIds = ['habit-1', 'habit-2', 'habit-3', 'habit-4'];
        const isLegacyHabit = (h: any) =>
          legacyHabitIds.includes(h.id) ||
          (typeof h.title === 'string' && h.title.includes('500ml'));

        const hasLegacy = parsed.some(isLegacyHabit);
        if (hasLegacy) {
          console.info('[habitStorage] Phát hiện và dọn dẹp triệt để thói quen demo cũ trong LocalStorage.');
          const cleanHabits = parsed.filter((h: any) => !isLegacyHabit(h));
          if (cleanHabits.length > 0) {
            localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(cleanHabits));
          } else {
            localStorage.removeItem(STORAGE_KEYS.HABITS);
          }
        }
      }
    }

    // 2. Dọn dẹp nhật ký check-in demo cũ
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (rawLogs) {
      const parsedLogs = JSON.parse(rawLogs);
      if (Array.isArray(parsedLogs)) {
        const legacyLogHabitIds = ['habit-1', 'habit-2', 'habit-3', 'habit-4'];
        const cleanLogs = parsedLogs.filter(
          (l: any) => !legacyLogHabitIds.includes(l.habitId)
        );
        if (cleanLogs.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cleanLogs));
        } else {
          localStorage.removeItem(STORAGE_KEYS.LOGS);
        }
      }
    }

    // 3. Dọn dẹp ghi chép phản tư demo cũ
    const rawNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (rawNotes) {
      const parsedNotes = JSON.parse(rawNotes);
      if (Array.isArray(parsedNotes)) {
        const cleanNotes = parsedNotes.filter(
          (n: any) => !['note-1', 'note-2'].includes(n.id)
        );
        if (cleanNotes.length > 0) {
          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(cleanNotes));
        } else {
          localStorage.removeItem(STORAGE_KEYS.NOTES);
        }
      }
    }

    // Lưu ý: Không xóa cờ STORAGE_KEYS.GUEST_MODE tại đây để người dùng ngoại tuyến không bị văng ra màn hình chào mừng khi tải lại trang
  } catch (err) {
    console.warn('[habitStorage] Lỗi khi làm sạch dữ liệu demo cũ:', err);
  }
}

// Tự động thanh lọc dữ liệu demo ngay khi nạp module
cleanLegacyDemoData();

export const habitStorage = {
  /**
   * Kích hoạt làm sạch dữ liệu demo cũ
   */
  cleanLegacyDemoData,

  /**
   * Xóa toàn bộ dữ liệu cục bộ trong LocalStorage
   */
  clearAllLocalData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.error('Failed to clear all local storage:', err);
    }
  },

  getHabits(): Habit[] {
    try {
      cleanLegacyDemoData();
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveHabits(habits: Habit[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (err) {
      console.error('Failed to save habits to local storage:', err);
    }
  },

  getLogs(): HabitLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveLogs(logs: HabitLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save logs to local storage:', err);
    }
  },

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save profile to local storage:', err);
    }
  },

  getNotes(): MicroNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveNotes(notes: MicroNote[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes to local storage:', err);
    }
  },

  isGuestMode(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true';
    } catch {
      return false;
    }
  },

  setGuestMode(enabled: boolean): void {
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.GUEST_MODE);
      }
    } catch (err) {
      console.error('Failed to save guest mode state:', err);
    }
  }
};


