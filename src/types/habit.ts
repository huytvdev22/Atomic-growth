/**
 * Phân loại nhịp sinh học trong ngày theo Atomic Habits
 */
export type RitualTime = 'morning' | 'midday' | 'evening';

/**
 * Danh mục của thói quen
 */
export type HabitCategory = 'health' | 'mind' | 'focus' | 'gratitude';

/**
 * Cấu trúc dữ liệu của một Thói Quen (Habit Model)
 */
export interface Habit {
  id: string;
  title: string;
  // Câu khẳng định bản sắc (Ví dụ: "Tôi là người chăm sóc sức khỏe dẻo dai")
  identityPrompt?: string;
  // Khối nhịp sinh học (Sáng, Chiều, Tối)
  ritual: RitualTime;
  // Danh mục thói quen
  category: HabitCategory;
  // Gợi ý micro-habit 2 phút (Make it Easy)
  twoMinuteVersion?: string;
  // Cặp đôi cám dỗ (Temptation Bundling - Make it Attractive)
  temptationBundle?: string;
  // Chuỗi ngày liên tiếp hiện tại
  currentStreak: number;
  // Kỷ lục chuỗi ngày dài nhất
  bestStreak: number;
  // Ngày hoàn thành gần nhất (định dạng YYYY-MM-DD)
  lastCompletedDate?: string;
  // Cờ báo hiệu đang trong thời gian ân hạn "Never Miss Twice"
  inGracePeriod?: boolean;
  // Thứ tự hiển thị
  order: number;
  // Thời điểm tạo
  createdAt: string;
}

/**
 * Nhật ký check-in thói quen theo ngày
 */
export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  timestamp: number;
  note?: string;
}

/**
 * Ghi chép phản tư vi mô (Micro-Reflection Note theo phong cách Flomo / FlareMo)
 */
export interface MicroNote {
  id: string;
  content: string;
  tag?: string;
  ritual?: RitualTime;
  date: string;
  createdAt: string;
}

/**
 * Nhật ký phản tư cuối ngày (Daily Reflection)
 */
export interface DailyReflection {
  date: string; // YYYY-MM-DD
  gratitudeNote: string;
  learningNote?: string;
  mood?: 'serene' | 'energized' | 'tired' | 'reflective';
  updatedAt: string;
}

/**
 * Hồ sơ và mục tiêu bản sắc của người dùng
 */
export interface UserProfile {
  id: string;
  name: string;
  // Tuyên ngôn bản sắc chủ đạo hiển thị trên Identity Card
  coreIdentityStatement: string;
  streakTargetDays: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
