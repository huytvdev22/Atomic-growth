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
  // Tên phân nhóm/chủ đề bài học (Subdeck, ví dụ: "01. Contract")
  subdeckName?: string;
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

/**
 * Thông tin file bên trong gói nén .apkg (ZIP archive)
 */
export interface AnkiZipFileInfo {
  name: string;
  sizeBytes: number;
  compressedSizeBytes?: number;
  isDatabaseFile: boolean;
  isMediaMapFile: boolean;
}

/**
 * Cấu trúc một trường dữ liệu trong mẫu ghi chú (Note Type Field)
 */
export interface AnkiModelField {
  index: number;
  name: string;
}

/**
 * Định nghĩa một loại ghi chú (Note Model / Note Type) trong cơ sở dữ liệu Anki
 */
export interface AnkiModelDefinition {
  id: string;
  name: string;
  fields: AnkiModelField[];
  templateNames: string[];
}

/**
 * Thông tin một bộ thẻ hoặc bộ thẻ con (Subdeck) phát hiện trong Anki
 */
export interface AnkiSubdeckInfo {
  id: string;
  name: string;
  cleanTitle: string;
  cardCount: number;
  isParent: boolean;
}

/**
 * Dữ liệu thô của một ghi chú (Raw Note) đọc trực tiếp từ bảng notes
 */
export interface AnkiRawNote {
  id: string;
  modelId: string;
  deckId?: string;
  fields: string[];
  tags: string[];
}

/**
 * Cảnh báo hoặc khuyến nghị chẩn đoán khi kiểm tra gói Anki
 */
export interface AnkiDiagnosticIssue {
  id: string;
  level: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  solution?: string;
}

/**
 * Cấu hình tùy biến ánh xạ trường (Custom Field Mapping)
 */
export interface AnkiFieldMappingConfig {
  modelId: string;
  frontFieldIndex?: number; // Tương thích cũ
  frontFieldIndices: number[]; // Danh sách các trường hiển thị ở mặt trước
  backFieldIndices: number[];
  audioFieldIndex?: number;
  imageFieldIndex?: number;
}

/**
 * Báo cáo kiểm tra và giải mã toàn diện gói Anki
 */
export interface AnkiInspectionReport {
  fileName: string;
  fileSizeBytes: number;
  zipFiles: AnkiZipFileInfo[];
  dbType: 'anki21' | 'anki2' | 'anki21b_zstd' | 'not_found';
  sqliteTables: string[];
  decks: AnkiSubdeckInfo[];
  models: Record<string, AnkiModelDefinition>;
  totalNotes: number;
  totalCards: number;
  mediaCount: number;
  mediaMap: Record<string, string>; // Số thứ tự -> Tên tệp đa phương tiện
  rawNotes: AnkiRawNote[];
  issues: AnkiDiagnosticIssue[];
  defaultMapping: Record<string, AnkiFieldMappingConfig>; // modelId -> config
}

