import { Habit, HabitLog, UserProfile, MicroNote } from '../types/habit';

const STORAGE_KEYS = {
  HABITS: 'atomic_growth_habits',
  LOGS: 'atomic_growth_logs',
  PROFILE: 'atomic_growth_profile',
  NOTES: 'atomic_growth_notes',
  GUEST_MODE: 'atomic_growth_guest_mode'
};

// Không sử dụng dữ liệu giả lập (Clean Slate theo triết lý Atomic Habits)
export const INITIAL_NOTES: MicroNote[] = [];

export const INITIAL_HABITS: Habit[] = [];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'Bạn',
  coreIdentityStatement: 'Tôi là người kiên trì phát triển bản thân 1% mỗi ngày.',
  streakTargetDays: 30,
  soundEnabled: true,
  vibrationEnabled: true
};

export const habitStorage = {
  getHabits(): Habit[] {
    try {
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

