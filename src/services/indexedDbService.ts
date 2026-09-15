import { AnkiDeck, AnkiCard, AnkiMediaItem } from '../types/anki';

const DB_NAME = 'AtomicGrowthAnkiDB';
const DB_VERSION = 1;

const STORES = {
  DECKS: 'decks',
  CARDS: 'cards',
  MEDIA: 'media'
} as const;

/**
 * Khởi tạo và kết nối tới IndexedDB lưu trữ Flashcards của Atomic Growth
 */
function openAnkiDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Kiểm tra xem trình duyệt có hỗ trợ IndexedDB hay không
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Object Store lưu trữ Bộ Thẻ (Decks)
      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        const deckStore = db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
        deckStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Object Store lưu trữ Danh sách Thẻ (Cards)
      if (!db.objectStoreNames.contains(STORES.CARDS)) {
        const cardStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
        cardStore.createIndex('deckId', 'deckId', { unique: false });
        cardStore.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // 3. Object Store lưu trữ Tài nguyên nhị phân Audio/Hình ảnh (Media Blobs)
      if (!db.objectStoreNames.contains(STORES.MEDIA)) {
        const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
        mediaStore.createIndex('deckId', 'deckId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Service quản trị lưu trữ cục bộ dung lượng cao bằng Native IndexedDB
 */
export const indexedDbService = {
  /**
   * Lưu hoặc cập nhật thông tin của một Bộ thẻ
   */
  async saveDeck(deck: AnkiDeck): Promise<void> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DECKS, 'readwrite');
      const store = tx.objectStore(STORES.DECKS);
      store.put(deck);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Lấy danh sách toàn bộ các bộ thẻ đã nạp
   */
  async getAllDecks(): Promise<AnkiDeck[]> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DECKS, 'readonly');
      const store = tx.objectStore(STORES.DECKS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Lấy chi tiết một bộ thẻ theo ID
   */
  async getDeckById(deckId: string): Promise<AnkiDeck | null> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DECKS, 'readonly');
      const store = tx.objectStore(STORES.DECKS);
      const request = store.get(deckId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Lưu hàng loạt thẻ (Batch Insert) vào cơ sở dữ liệu
   */
  async saveCardsBatch(cards: AnkiCard[]): Promise<void> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CARDS, 'readwrite');
      const store = tx.objectStore(STORES.CARDS);
      for (const card of cards) {
        store.put(card);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Lấy tất cả thẻ thuộc một bộ thẻ
   */
  async getCardsByDeckId(deckId: string): Promise<AnkiCard[]> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CARDS, 'readonly');
      const store = tx.objectStore(STORES.CARDS);
      const index = store.index('deckId');
      const request = index.getAll(deckId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Lấy danh sách các thẻ cần ôn tập hôm nay (Due Cards) theo quy tắc 2 phút (giới hạn số lượng)
   */
  async getDueCards(deckId: string, limit = 10): Promise<AnkiCard[]> {
    const allCards = await this.getCardsByDeckId(deckId);
    const todayStr = new Date().toISOString().split('T')[0];

    // Lọc các thẻ có dueDate <= hôm nay, hoặc thẻ mới chưa học
    const dueCards = allCards.filter(
      (card) => card.state === 'new' || card.dueDate <= todayStr
    );

    // Trả về tối đa theo limit để đảm bảo phiên học nhẹ nhàng không gây ngộp
    return dueCards.slice(0, limit);
  },

  /**
   * Cập nhật tiến độ lặp lại ngắt quãng (SRS) của một thẻ sau khi người dùng đánh giá
   */
  async recordCardReview(cardId: string, remembered: boolean): Promise<void> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CARDS, 'readwrite');
      const store = tx.objectStore(STORES.CARDS);
      const getReq = store.get(cardId);

      getReq.onsuccess = () => {
        const card: AnkiCard = getReq.result;
        if (!card) {
          resolve();
          return;
        }

        const now = new Date();

        if (remembered) {
          // Nếu nhớ: tăng số lần lặp, tăng khoảng cách ngày (1 ngày -> 3 ngày -> 7 ngày -> 16 ngày)
          card.reps += 1;
          const newInterval = card.interval === 0 ? 1 : Math.round(card.interval * 2.2);
          card.interval = newInterval;
          card.state = card.reps >= 3 ? 'mastered' : 'review';

          const nextDate = new Date();
          nextDate.setDate(now.getDate() + newInterval);
          card.dueDate = nextDate.toISOString().split('T')[0];
        } else {
          // Nếu quên: đặt lại chu kỳ về 1 ngày, tăng số lần lapse
          card.lapses += 1;
          card.interval = 1;
          card.state = 'learning';

          const tomorrow = new Date();
          tomorrow.setDate(now.getDate() + 1);
          card.dueDate = tomorrow.toISOString().split('T')[0];
        }

        store.put(card);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Lưu hàng loạt tệp âm thanh/hình ảnh vào store Media
   */
  async saveMediaItemsBatch(items: AnkiMediaItem[]): Promise<void> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA, 'readwrite');
      const store = tx.objectStore(STORES.MEDIA);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Lấy tệp âm thanh/hình ảnh theo ID file (tên file thật)
   */
  async getMediaBlob(mediaId: string): Promise<Blob | null> {
    const db = await openAnkiDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA, 'readonly');
      const store = tx.objectStore(STORES.MEDIA);
      const request = store.get(mediaId);
      request.onsuccess = () => {
        const result: AnkiMediaItem | undefined = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Xóa toàn bộ một bộ thẻ cùng các thẻ con và media đi kèm
   */
  async deleteDeck(deckId: string): Promise<void> {
    const db = await openAnkiDatabase();

    // 1. Xóa deck
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DECKS, 'readwrite');
      tx.objectStore(STORES.DECKS).delete(deckId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 2. Xóa tất cả thẻ của deck
    const cards = await this.getCardsByDeckId(deckId);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.CARDS, 'readwrite');
      const cardStore = tx.objectStore(STORES.CARDS);
      for (const card of cards) {
        cardStore.delete(card.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 3. Xóa tất cả media của deck
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA, 'readwrite');
      const mediaStore = tx.objectStore(STORES.MEDIA);
      const index = mediaStore.index('deckId');
      const req = index.getAllKeys(deckId);
      req.onsuccess = () => {
        const keys = req.result;
        for (const key of keys) {
          mediaStore.delete(key);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
