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
