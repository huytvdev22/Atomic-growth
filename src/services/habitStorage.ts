import { Habit, HabitLog, UserProfile, MicroNote } from '../types/habit';
import { getYesterdayString, getTodayString } from '../utils/habitCalculations';

const STORAGE_KEYS = {
  HABITS: 'atomic_growth_habits',
  LOGS: 'atomic_growth_logs',
  PROFILE: 'atomic_growth_profile',
  NOTES: 'atomic_growth_notes'
};

export const INITIAL_NOTES: MicroNote[] = [
  {
    id: 'note-1',
    content: 'Uống nước ấm và khởi động nhẹ 5 phút mỗi sáng giúp tinh thần tỉnh táo rõ rệt trước khi bắt đầu công việc.',
    tag: 'health',
    ritual: 'morning',
    date: getTodayString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'note-2',
    content: 'Đọc xong chương 2 Atomic Habits: Hãy tập trung vào câu hỏi "Tôi muốn trở thành người như thế nào?" thay vì chỉ chăm chăm đếm số.',
    tag: 'focus',
    ritual: 'midday',
    date: getYesterdayString(),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Dữ liệu mẫu khởi đầu mang tinh thần Botanical Zen & Atomic Habits (Sạch, trung thực, streak bắt đầu từ 0)
export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Uống 500ml nước ấm & Duỗi cơ nhẹ',
    identityPrompt: 'Tôi là người lắng nghe và chăm sóc cơ thể mỗi sáng',
    ritual: 'morning',
    category: 'health',
    twoMinuteVersion: 'Uống ngay 1 ly nước lọc đặt sẵn cạnh đầu giường',
    currentStreak: 0,
    bestStreak: 0,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit-2',
    title: 'Thiền định tĩnh tâm (10 phút)',
    identityPrompt: 'Tôi là người làm chủ cảm xúc và suy nghĩ tĩnh tại',
    ritual: 'morning',
    category: 'mind',
    twoMinuteVersion: 'Nhắm mắt ngồi thẳng lưng hít thở sâu 3 nhịp',
    currentStreak: 0,
    bestStreak: 0,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit-3',
    title: 'Đọc 10 trang sách phát triển bản thân',
    identityPrompt: 'Tôi là một người đọc sách và học tập suốt đời',
    ritual: 'midday',
    category: 'focus',
    twoMinuteVersion: 'Đọc chỉ 1 trang sách sau bữa trưa',
    temptationBundle: 'Pha một tách trà thảo mộc yêu thích khi đọc',
    currentStreak: 0,
    bestStreak: 0,
    order: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit-4',
    title: 'Viết 1 dòng phản tư & điều biết ơn',
    identityPrompt: 'Tôi là người trân trọng những điều tốt đẹp dung dị',
    ritual: 'evening',
    category: 'gratitude',
    twoMinuteVersion: 'Ghi 1 điều khiến bạn mỉm cười hôm nay',
    currentStreak: 0,
    bestStreak: 0,
    order: 4,
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'Người bạn kiên định',
  coreIdentityStatement: 'Tôi là một người đọc sách và luôn chăm sóc cơ thể mỗi ngày.',
  streakTargetDays: 30,
  soundEnabled: true,
  vibrationEnabled: true
};

/**
 * Trả về mảng rỗng cho logs ban đầu để phản ánh trung thực tiến độ (Clean Slate)
 */
function createInitialLogs(): HabitLog[] {
  return [];
}

export const habitStorage = {
  getHabits(): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (data) return JSON.parse(data);
      this.saveHabits(INITIAL_HABITS);
      return INITIAL_HABITS;
    } catch {
      return INITIAL_HABITS;
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
      const initialLogs = createInitialLogs();
      this.saveLogs(initialLogs);
      return initialLogs;
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
      this.saveProfile(DEFAULT_PROFILE);
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
      this.saveNotes(INITIAL_NOTES);
      return INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  },

  saveNotes(notes: MicroNote[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes to local storage:', err);
    }
  }
};
