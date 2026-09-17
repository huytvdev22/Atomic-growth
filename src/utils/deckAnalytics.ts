import { AnkiCard, calculateCardVitality } from '../types/anki';

/**
 * Cấu trúc phân loại sức khỏe và cấp độ sinh trưởng của bộ thẻ
 */
export interface DeckVitalityCounts {
  newCount: number;
  fragileCount: number;
  growingCount: number;
  steadyCount: number;
  totalCards: number;
  // Tỷ lệ % của từng loại
  newPct: number;
  fragilePct: number;
  growingPct: number;
  steadyPct: number;
  // Tỷ lệ làm chủ (% thẻ đã vào giai đoạn steady)
  masteryRate: number;
}

/**
 * Cấu trúc một điểm dữ liệu trong biểu đồ dự báo đến hạn (Future Due)
 */
export interface FutureDueItem {
  dateStr: string; // Định dạng YYYY-MM-DD
  dayLabel: string; // Ví dụ: "Hôm nay", "Ngày mai", "T5 18/9"
  dueCount: number; // Số thẻ đến hạn trong ngày này
  isToday: boolean;
  isTomorrow: boolean;
}

/**
 * Tổng hợp thông tin dự báo đến hạn
 */
export interface FutureDueForecast {
  items: FutureDueItem[];
  totalForecastReviews: number;
  averagePerDay: number;
  dueToday: number;
  dueTomorrow: number;
  peakDayCount: number;
}

/**
 * Cấu trúc ô trong Mini Garden Heatmap của bộ thẻ
 */
export interface DeckHeatmapCell {
  dateStr: string; // YYYY-MM-DD
  count: number; // Số thẻ đã ôn tập trong ngày
  level: 0 | 1 | 2 | 3 | 4; // Cấp độ màu sắc xanh Botanical Zen
}

/**
 * Khóa lưu trữ lịch sử ôn tập cục bộ theo Deck trong LocalStorage
 */
const DECK_HISTORY_PREFIX = 'atomic_growth_deck_history_';

/**
 * 1. Tính toán phân bổ số lượng và tỷ lệ % sinh trưởng của bộ thẻ
 */
export function calculateDeckVitalityCounts(cards: AnkiCard[]): DeckVitalityCounts {
  const total = cards.length;
  if (total === 0) {
    return {
      newCount: 0,
      fragileCount: 0,
      growingCount: 0,
      steadyCount: 0,
      totalCards: 0,
      newPct: 0,
      fragilePct: 0,
      growingPct: 0,
      steadyPct: 0,
      masteryRate: 0
    };
  }

  let newCount = 0;
  let fragileCount = 0;
  let growingCount = 0;
  let steadyCount = 0;

  cards.forEach((card) => {
    // Thẻ mới chưa từng ôn lần nào
    if (card.reps === 0 || card.state === 'new') {
      newCount++;
      return;
    }

    const vitality = calculateCardVitality(card);
    if (vitality === 'fragile') {
      fragileCount++;
    } else if (vitality === 'growing') {
      growingCount++;
    } else {
      steadyCount++;
    }
  });

  const calcPct = (cnt: number) => Math.round((cnt / total) * 100);

  const newPct = calcPct(newCount);
  const fragilePct = calcPct(fragileCount);
  const growingPct = calcPct(growingCount);
  const steadyPct = calcPct(steadyCount);
  const masteryRate = steadyPct;

  return {
    newCount,
    fragileCount,
    growingCount,
    steadyCount,
    totalCards: total,
    newPct,
    fragilePct,
    growingPct,
    steadyPct,
    masteryRate
  };
}

/**
 * 2. Dự báo số thẻ đến hạn trong tương lai (Future Due Forecast) trong N ngày tới
 */
export function generateFutureDueForecast(cards: AnkiCard[], days = 14): FutureDueForecast {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items: FutureDueItem[] = [];
  const dueDateMap: Record<string, number> = {};

  // Khởi tạo các mốc ngày trong phạm vi dự báo
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dueDateMap[dateStr] = 0;
  }

  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Gom nhóm các thẻ theo ngày đến hạn
  cards.forEach((card) => {
    // Nếu là thẻ mới hoặc thẻ đã quá hạn từ trước -> Gom vào "Hôm nay"
    if (card.state === 'new' || !card.dueDate || card.dueDate <= todayStr) {
      dueDateMap[todayStr] = (dueDateMap[todayStr] || 0) + 1;
    } else if (dueDateMap[card.dueDate] !== undefined) {
      dueDateMap[card.dueDate]++;
    }
  });

  let totalForecast = 0;
  let peak = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const count = dueDateMap[dateStr] || 0;

    totalForecast += count;
    if (count > peak) peak = count;

    let dayLabel = '';
    if (i === 0) {
      dayLabel = 'Hôm nay';
    } else if (i === 1) {
      dayLabel = 'Ngày mai';
    } else {
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      dayLabel = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    }

    items.push({
      dateStr,
      dayLabel,
      dueCount: count,
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }

  const dueToday = dueDateMap[todayStr] || 0;
  const dueTomorrow = dueDateMap[tomorrowStr] || 0;
  const averagePerDay = Math.round(totalForecast / days);

  return {
    items,
    totalForecastReviews: totalForecast,
    averagePerDay,
    dueToday,
    dueTomorrow,
    peakDayCount: peak
  };
}

/**
 * 3. Lấy dữ liệu lịch sử ôn tập của một Deck từ LocalStorage
 */
export function getDeckReviewHistory(deckId: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${DECK_HISTORY_PREFIX}${deckId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * 4. Ghi nhận số lượng thẻ đã học trong một phiên vào lịch sử ôn tập của Deck
 */
export function recordDeckStudySession(deckId: string, cardCount: number): void {
  if (typeof window === 'undefined' || cardCount <= 0) return;
  try {
    const history = getDeckReviewHistory(deckId);
    const todayStr = new Date().toISOString().split('T')[0];
    history[todayStr] = (history[todayStr] || 0) + cardCount;
    localStorage.setItem(`${DECK_HISTORY_PREFIX}${deckId}`, JSON.stringify(history));
  } catch (err) {
    console.warn('Không thể lưu lịch sử ôn tập deck:', err);
  }
}

/**
 * 5. Tính chuỗi ngày ôn tập liên tục (Deck Streak)
 */
export function calculateDeckStreak(history: Record<string, number>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Nếu cả hôm nay và hôm qua đều không có ôn tập -> chuỗi = 0
  if (!history[todayStr] && !history[yesterdayStr]) {
    return 0;
  }

  let streak = 0;
  let checkDate = history[todayStr] ? today : yesterday;

  while (true) {
    const dateKey = checkDate.toISOString().split('T')[0];
    if (history[dateKey] && history[dateKey] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 6. Tạo dữ liệu cho Mini Garden Heatmap (phong cách Sáng Botanical Zen) trong 28 ngày (4 tuần)
 */
export function generateDeckHeatmapCells(history: Record<string, number>, days = 28): DeckHeatmapCell[] {
  const cells: DeckHeatmapCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tạo danh sách lùi về 28 ngày trước
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = history[dateStr] || 0;

    // Phân cấp màu xanh mầm theo mức độ tích cực (Phong cách Sáng Botanical Zen)
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count === 0) {
      level = 0; // Trắng/Lanh nhạt
    } else if (count <= 5) {
      level = 1; // Mầm non rất nhạt
    } else if (count <= 10) {
      level = 2; // Mầm non tươi
    } else if (count <= 20) {
      level = 3; // Xanh bách vừa
    } else {
      level = 4; // Xanh bách đậm sâu lắng
    }

    cells.push({ dateStr, count, level });
  }

  return cells;
}

/**
 * 7. Hàm tính toán khoảng cách ngày ôn tập tiếp theo (Next Interval) để hiển thị trên nút đánh giá
 */
export function predictNextInterval(card: AnkiCard, remembered: boolean): string {
  if (!remembered) {
    return '1 ngày';
  }

  // Nếu đánh giá là Đã nhớ
  if (card.reps === 0 || card.interval === 0) {
    return '1 ngày';
  }

  const nextInterval = Math.round(card.interval * 2.2);
  if (nextInterval >= 30) {
    const months = Math.round(nextInterval / 30);
    return `${months} tháng`;
  }

  return `${nextInterval} ngày`;
}
