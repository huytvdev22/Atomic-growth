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

// Dữ liệu mẫu khởi đầu mang tinh thần Botanical Zen & Atomic Habits
export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Uống 500ml nước ấm & Duỗi cơ nhẹ',
    identityPrompt: 'Tôi là người lắng nghe và chăm sóc cơ thể mỗi sáng',
    ritual: 'morning',
    category: 'health',
    twoMinuteVersion: 'Uống ngay 1 ly nước lọc đặt sẵn cạnh đầu giường',
    currentStreak: 18,
    bestStreak: 25,
    lastCompletedDate: getYesterdayString(),
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
    currentStreak: 9,
    bestStreak: 14,
    lastCompletedDate: getYesterdayString(),
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
    currentStreak: 24,
    bestStreak: 30,
    lastCompletedDate: getYesterdayString(),
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
    currentStreak: 5,
    bestStreak: 12,
    lastCompletedDate: getYesterdayString(),
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
 * Tạo sẵn dữ liệu nhật ký cho 14 ngày qua để ma trận Heatmap hiển thị khu vườn sinh trưởng
 */
function createInitialLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const today = new Date();

  for (let i = 13; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Tạo ngẫu nhiên 2 - 4 thói quen hoàn thành mỗi ngày để minh họa các sắc thái xanh
    const completedCount = i % 4 === 0 ? 2 : i % 3 === 0 ? 3 : 4;
    for (let j = 0; j < completedCount; j++) {
      logs.push({
        id: `log-${dateStr}-${INITIAL_HABITS[j].id}`,
        habitId: INITIAL_HABITS[j].id,
        date: dateStr,
        completed: true,
        timestamp: d.getTime()
      });
    }
  }

  // Hôm qua hoàn thành 3/4
  const yesterdayStr = getYesterdayString();
  logs.push(
    { id: `log-${yesterdayStr}-1`, habitId: 'habit-1', date: yesterdayStr, completed: true, timestamp: Date.now() },
    { id: `log-${yesterdayStr}-2`, habitId: 'habit-2', date: yesterdayStr, completed: true, timestamp: Date.now() },
    { id: `log-${yesterdayStr}-3`, habitId: 'habit-3', date: yesterdayStr, completed: true, timestamp: Date.now() }
  );

  return logs;
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
