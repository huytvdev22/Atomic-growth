import { AnkiCard, calculateCardVitality } from '../types/anki';

/**
 * Hàm định dạng ngày sang định dạng YYYY-MM-DD theo múi giờ địa phương
 * Tránh lỗi chuyển múi giờ UTC làm lùi ngày khi dùng toISOString()
 */
export function formatDateToLocalString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
 * 1. Lấy danh sách các thẻ mong manh (Fragile) cần cấp cứu
 * Bao gồm các thẻ đã từng học (reps > 0) mà:
 * - Vừa bị quên (lapses > 0 hoặc calculateCardVitality(c) === 'fragile')
 * - Hoặc đang ở trạng thái 'learning' với khoảng cách ngày ngắn (interval <= 2)
 * Sắp xếp theo mức độ ưu tiên: lapse nhiều nhất lên đầu, sau đó interval ngắn nhất
 */
export function getFragileCards(cards: AnkiCard[]): AnkiCard[] {
  return cards
    .filter((c) => {
      if (c.reps === 0 || c.state === 'new') return false;
      return (
        calculateCardVitality(c) === 'fragile' ||
        c.lapses > 0 ||
        c.state === 'learning' ||
        c.interval <= 2
      );
    })
    .sort((a, b) => {
      if (b.lapses !== a.lapses) {
        return b.lapses - a.lapses;
      }
      return a.interval - b.interval;
    });
}

/**
 * 2. Tính toán phân bổ số lượng và tỷ lệ % sinh trưởng của bộ thẻ
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

    // Thẻ fragile: đã ôn mà bị quên hoặc rơi vào trạng thái mầm yếu
    if (
      calculateCardVitality(card) === 'fragile' ||
      card.lapses > 0 ||
      card.state === 'learning' ||
      card.interval <= 1
    ) {
      fragileCount++;
    } else if (card.interval >= 14 || card.state === 'mastered') {
      steadyCount++;
    } else {
      growingCount++;
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
 * 3. Dự báo số thẻ đến hạn trong tương lai (Future Due Forecast) trong N ngày tới
 * Chuẩn hóa tính toán theo múi giờ địa phương để khớp chính xác với lịch sinh học
 */
export function generateFutureDueForecast(cards: AnkiCard[], days = 14): FutureDueForecast {
  const now = new Date();
  const items: FutureDueItem[] = [];
  const dueDateMap: Record<string, number> = {};

  const todayStr = formatDateToLocalString(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDateToLocalString(tomorrow);

  // Khởi tạo các mốc ngày trong phạm vi dự báo (theo local date)
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = formatDateToLocalString(d);
    dueDateMap[dateStr] = 0;
  }

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
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = formatDateToLocalString(d);
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
 * 4. Lấy dữ liệu lịch sử ôn tập của một Deck từ LocalStorage
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
 * 5. Ghi nhận số lượng thẻ đã học trong một phiên vào lịch sử ôn tập của Deck
 * Sử dụng múi giờ địa phương để đảm bảo ô Heatmap hôm nay sáng màu ngay lập tức
 */
export function recordDeckStudySession(deckId: string, cardCount: number): void {
  if (typeof window === 'undefined' || cardCount <= 0) return;
  try {
    const history = getDeckReviewHistory(deckId);
    const todayStr = formatDateToLocalString(new Date());
    history[todayStr] = (history[todayStr] || 0) + cardCount;
    localStorage.setItem(`${DECK_HISTORY_PREFIX}${deckId}`, JSON.stringify(history));
  } catch (err) {
    console.warn('Không thể lưu lịch sử ôn tập deck:', err);
  }
}

/**
 * 6. Tính chuỗi ngày ôn tập liên tục (Deck Streak)
 */
export function calculateDeckStreak(history: Record<string, number>): number {
  const now = new Date();
  const todayStr = formatDateToLocalString(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateToLocalString(yesterday);

  // Nếu cả hôm nay và hôm qua đều không có ôn tập -> chuỗi = 0
  if (!history[todayStr] && !history[yesterdayStr]) {
    return 0;
  }

  let streak = 0;
  let checkDate = history[todayStr] ? new Date(now) : yesterday;

  while (true) {
    const dateKey = formatDateToLocalString(checkDate);
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
 * 7. Tạo dữ liệu cho Mini Garden Heatmap (phong cách Sáng Botanical Zen) trong 28 ngày (4 tuần)
 * Đảm bảo ô cuối cùng trong mảng luôn là ngày hôm nay theo múi giờ địa phương
 */
export function generateDeckHeatmapCells(history: Record<string, number>, days = 28): DeckHeatmapCell[] {
  const cells: DeckHeatmapCell[] = [];
  const now = new Date();

  // Tạo danh sách lùi về 28 ngày trước theo local date
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDateToLocalString(d);
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
 * 8. Hàm tính toán khoảng cách ngày ôn tập tiếp theo (Next Interval) để hiển thị trên nút đánh giá
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
