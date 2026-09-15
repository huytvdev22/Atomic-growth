import { HabitLog } from '../types/habit';

/**
 * Lấy chuỗi ngày hôm nay định dạng YYYY-MM-DD theo múi giờ địa phương
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy chuỗi ngày hôm qua định dạng YYYY-MM-DD
 */
export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tính số ngày cách biệt giữa 2 chuỗi ngày (date2 - date1)
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Cập nhật chuỗi Streak theo nguyên lý nhân ái "Never Miss Twice" của James Clear:
 * - Nếu lỡ 1 ngày: Chuỗi không bị xóa trắng về 0, chuyển sang cờ ân hạn phục hồi.
 * - Nếu lỡ từ 2 ngày liên tiếp trở lên: Chuỗi mới reset về 1.
 */
export function evaluateStreakOnCheckIn(
  lastDate: string | undefined,
  currentStreak: number,
  todayStr: string = getTodayString()
): { newStreak: number; inGracePeriod: boolean } {
  if (!lastDate) {
    return { newStreak: 1, inGracePeriod: false };
  }

  if (lastDate === todayStr) {
    // Đã hoàn thành trong ngày hôm nay rồi
    return { newStreak: currentStreak, inGracePeriod: false };
  }

  const daysDiff = getDaysDifference(lastDate, todayStr);

  if (daysDiff === 1) {
    // Hoàn thành liên tiếp mỗi ngày (Hôm qua -> Hôm nay)
    return { newStreak: currentStreak + 1, inGracePeriod: false };
  }

  if (daysDiff === 2) {
    // Lỡ mất 1 ngày hôm qua -> Áp dụng quy tắc "Never Miss Twice" để cứu chuỗi!
    return { newStreak: currentStreak + 1, inGracePeriod: false };
  }

  // Lỡ từ 2 ngày trở lên -> Khởi động lại chuỗi mới với 1
  return { newStreak: 1, inGracePeriod: false };
}

/**
 * Cấu trúc 1 ô cell trong Heatmap
 */
export interface HeatmapCell {
  date: string;
  completedCount: number;
  totalHabits: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
}

/**
 * Sinh ma trận ô vuông đóng góp (Garden Heatmap) cho N ngày gần nhất
 */
export function generateGardenHeatmap(
  logs: HabitLog[],
  totalActiveHabits: number,
  daysCount: number = 14
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const todayStr = getTodayString();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Đếm số lượng thói quen đã hoàn thành trong ngày này
    const completedForDay = logs.filter(log => log.date === dateStr && log.completed).length;
    
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (completedForDay > 0) {
      const ratio = totalActiveHabits > 0 ? completedForDay / totalActiveHabits : 0;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.4) level = 2;
      else level = 1;
    }

    cells.push({
      date: dateStr,
      completedCount: completedForDay,
      totalHabits: totalActiveHabits,
      level,
      isToday: dateStr === todayStr,
    });
  }

  return cells;
}

/**
 * Tính toán chuỗi Streak hiệu lực thực tế của 1 thói quen (Dynamic Effective Streak)
 * Tránh việc streak cũ bị đóng băng tĩnh khi người dùng đã bỏ lỡ nhiều ngày
 */
export function calculateEffectiveHabitStreak(
  habit: { currentStreak: number; lastCompletedDate?: string },
  todayStr: string = getTodayString()
): number {
  if (!habit.lastCompletedDate || habit.currentStreak <= 0) {
    return 0;
  }

  const daysDiff = getDaysDifference(habit.lastCompletedDate, todayStr);

  // Hôm nay đã hoàn thành (0) hoặc hôm qua đã hoàn thành (1)
  if (daysDiff === 0 || daysDiff === 1) {
    return habit.currentStreak;
  }

  // Bỏ lỡ 1 ngày hôm qua (2) -> Đang trong ân hạn "Never Miss Twice"
  if (daysDiff === 2) {
    return habit.currentStreak;
  }

  // Đã bỏ lỡ từ 2 ngày trở lên -> Chuỗi thực tế là 0
  return 0;
}

/**
 * Tính số ngày kiên trì liên tiếp của toàn bộ Khu Vườn (Garden Heatmap Streak)
 * Quét ngược từ hôm nay/hôm qua dựa trên mảng logs thực tế, khớp 100% với ô vuông trên ma trận
 */
export function calculateGardenActiveStreak(
  logs: HabitLog[],
  todayStr: string = getTodayString()
): number {
  if (!logs || logs.length === 0) return 0;

  // Lấy danh sách các ngày duy nhất có ít nhất 1 thói quen được hoàn thành
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  if (completedDates.size === 0) return 0;

  const yesterdayStr = getYesterdayString();
  const hasCompletedToday = completedDates.has(todayStr);
  const hasCompletedYesterday = completedDates.has(yesterdayStr);

  // Nếu cả hôm nay và hôm qua đều chưa hoàn thành gì
  if (!hasCompletedToday && !hasCompletedYesterday) {
    const dBeforeYesterday = new Date();
    dBeforeYesterday.setDate(dBeforeYesterday.getDate() - 2);
    const dayBeforeYesterdayStr = `${dBeforeYesterday.getFullYear()}-${String(dBeforeYesterday.getMonth() + 1).padStart(2, '0')}-${String(dBeforeYesterday.getDate()).padStart(2, '0')}`;
    
    // Nếu cả 2 ngày qua đều trống -> Chuỗi kết thúc, trả về 0
    if (!completedDates.has(dayBeforeYesterdayStr)) {
      return 0;
    }
  }

  // Bắt đầu đếm ngược từ ngày có hoạt động gần nhất
  let streak = 0;
  let missedGraceUsed = false;
  const curr = new Date();
  if (!hasCompletedToday) {
    curr.setDate(curr.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    if (completedDates.has(dStr)) {
      streak++;
      missedGraceUsed = false;
    } else {
      // Quy tắc Never Miss Twice: cho phép bỏ qua 1 ngày nếu trước đó có chuỗi
      if (!missedGraceUsed && streak > 0) {
        missedGraceUsed = true;
      } else {
        break;
      }
    }
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}
