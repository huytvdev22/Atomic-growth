/**
 * Cấu trúc dữ liệu cho Bộ Thẻ (Anki Deck)
 */
export interface AnkiDeck {
  id: string;
  title: string;
  description?: string;
  cardCount: number;
  createdAt: string;
  lastReviewedAt?: string;
  // ID của Thói quen trên Timeline được liên kết với bộ thẻ này (nếu có)
  linkedHabitId?: string;
  // Metadata đồng bộ Google Drive
  driveFileId?: string;
  driveFileName?: string;
  driveSyncedAt?: string;
  rawFileName?: string;
}

/**
 * Trạng thái học tập của một thẻ Flashcard theo Spaced Repetition
 */
export type CardState = 'new' | 'learning' | 'review' | 'mastered';

/**
 * Cấu trúc dữ liệu cho một Thẻ Flashcard (Anki Card)
 */
export interface AnkiCard {
  id: string;
  deckId: string;
  noteId: string;
  // Nội dung mặt trước (Từ vựng, câu hỏi, hoặc định dạng Cloze)
  front: string;
  // Nội dung mặt sau (Nghĩa, ví dụ, giải thích)
  back: string;
  // Tên file âm thanh đính kèm (nếu có, VD: "irregular_verbs_go.mp3")
  audioName?: string;
  // Tên file hình ảnh đính kèm (nếu có)
  imageName?: string;
  // Ngày đến hạn ôn tập tiếp theo (định dạng YYYY-MM-DD)
  dueDate: string;
  // Khoảng cách lặp lại (tính theo ngày)
  interval: number;
  // Số lần đã ôn tập thành công
  reps: number;
  // Số lần bị quên (lapses)
  lapses: number;
  // Thẻ tags phân loại chủ đề (nếu có)
  tags?: string[];
  // Trạng thái hiện tại của thẻ
  state: CardState;
}

/**
 * Cấu trúc tệp đa phương tiện (Audio/Hình ảnh) lưu trong IndexedDB
 */
export interface AnkiMediaItem {
  id: string; // Tên file, ví dụ: "pronounced_went.mp3"
  deckId: string;
  mimeType: string;
  blob: Blob;
}

/**
 * Trạng thái của một phiên ôn tập 2 phút (Atomic Review Session)
 */
export interface ReviewSession {
  deckId: string;
  deckTitle: string;
  cards: AnkiCard[];
  currentIndex: number;
  reviewedCount: number;
  masteredCount: number;
  againCount: number;
  isCompleted: boolean;
}

/**
 * 3 Cấp độ ghi nhớ trực quan (Memory Vitality) theo phong cách Botanical Zen
 * - fragile: Hạt mầm mong manh (1 vạch) - Thẻ mới học hoặc vừa bị quên
 * - growing: Đang sinh trưởng (2 vạch) - Đang ngấm dần vào trí nhớ ngắn hạn
 * - steady: Rễ sâu vững chắc (3 vạch) - Đã bước vào trí nhớ dài hạn (interval >= 14 ngày)
 */
export type MemoryVitality = 'fragile' | 'growing' | 'steady';

/**
 * Hàm tính toán cấp độ ghi nhớ từ thông số Spaced Repetition (SRS)
 */
export function calculateCardVitality(card: AnkiCard): MemoryVitality {
  if (card.reps === 0 || card.state === 'new' || (card.lapses > 0 && card.interval <= 1)) {
    return 'fragile';
  }
  if (card.interval >= 14 || card.state === 'mastered') {
    return 'steady';
  }
  return 'growing';
}

/**
 * Cấu trúc thông tin tiến độ của một thẻ để đồng bộ lên Cloud Firestore
 */
export interface CardProgressItem {
  state: CardState;
  interval: number;
  reps: number;
  lapses: number;
  dueDate: string;
  vitality: MemoryVitality;
}

/**
 * Document tiến độ đồng bộ siêu nhẹ trên Cloud Firestore:
 * Đường dẫn: users/{userId}/anki_progress/{deckId}
 */
export interface DeckProgressDoc {
  deckId: string;
  lastStudiedAt: string;
  totalCards: number;
  stats: {
    fragile: number;
    growing: number;
    steady: number;
  };
  cardsProgress: Record<string, CardProgressItem>;
}

