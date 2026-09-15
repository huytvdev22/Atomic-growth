import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AnkiCard, DeckProgressDoc, calculateCardVitality, CardProgressItem } from '../types/anki';
import { indexedDbService } from './indexedDbService';

/**
 * Service đồng bộ tiến độ ghi nhớ thẻ Anki lên Cloud Firestore
 * Áp dụng giải pháp "Đồng bộ Tiến độ Siêu nhẹ" (Lightweight Progress Sync):
 * - Không đẩy ảnh hay file âm thanh MP3 lên Cloud Firestore.
 * - Mỗi bộ thẻ chỉ là 1 document duy nhất tại: users/{userId}/anki_progress/{deckId}
 * - Tự động đồng bộ mức độ ghi nhớ (Fragile / Growing / Steady) giữa điện thoại và máy tính.
 */
export const ankiFirestoreSync = {
  /**
   * Đồng bộ tiến độ thẻ hiện tại trong IndexedDB lên Cloud Firestore
   */
  async syncDeckProgressToFirestore(
    userId: string,
    deckId: string,
    cardsList?: AnkiCard[]
  ): Promise<void> {
    if (!db || !userId || !deckId) return;

    try {
      // 1. Lấy danh sách thẻ từ IndexedDB nếu chưa được truyền vào
      const cards = cardsList || (await indexedDbService.getCardsByDeckId(deckId));
      if (cards.length === 0) return;

      const cardsProgress: Record<string, CardProgressItem> = {};
      let fragileCount = 0;
      let growingCount = 0;
      let steadyCount = 0;

      // 2. Tính toán cấp độ sinh trưởng cho từng thẻ
      for (const card of cards) {
        const vitality = calculateCardVitality(card);
        if (vitality === 'fragile') fragileCount++;
        else if (vitality === 'growing') growingCount++;
        else steadyCount++;

        cardsProgress[card.id] = {
          state: card.state,
          interval: card.interval,
          reps: card.reps,
          lapses: card.lapses,
          dueDate: card.dueDate,
          vitality
        };
      }

      // 3. Chuẩn bị payload siêu nhẹ (chỉ vài KB)
      const payload: DeckProgressDoc = {
        deckId,
        lastStudiedAt: new Date().toISOString(),
        totalCards: cards.length,
        stats: {
          fragile: fragileCount,
          growing: growingCount,
          steady: steadyCount
        },
        cardsProgress
      };

      // 4. Lưu lên Firestore
      const docRef = doc(db, 'users', userId, 'anki_progress', deckId);
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn('Lỗi khi đồng bộ tiến độ thẻ lên Firestore:', err);
    }
  },

  /**
   * Kéo tiến độ thẻ từ Cloud Firestore về
   */
  async fetchDeckProgressFromFirestore(
    userId: string,
    deckId: string
  ): Promise<DeckProgressDoc | null> {
    if (!db || !userId || !deckId) return null;

    try {
      const docRef = doc(db, 'users', userId, 'anki_progress', deckId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as DeckProgressDoc;
      }
      return null;
    } catch (err) {
      console.warn('Lỗi khi tải tiến độ thẻ từ Firestore:', err);
      return null;
    }
  },

  /**
   * Tự động hợp nhất tiến độ từ Cloud Firestore vào IndexedDB cục bộ của máy hiện tại
   * (Dùng khi người dùng mở bộ thẻ trên một thiết bị mới sau khi khôi phục từ Drive)
   */
  async mergeFirestoreProgressToIndexedDb(
    userId: string,
    deckId: string
  ): Promise<boolean> {
    if (!db || !userId || !deckId) return false;

    try {
      const progressDoc = await this.fetchDeckProgressFromFirestore(userId, deckId);
      if (!progressDoc || !progressDoc.cardsProgress) return false;

      // Cập nhật hàng loạt vào IndexedDB cục bộ
      await indexedDbService.updateCardsProgressBatch(progressDoc.cardsProgress);
      return true;
    } catch (err) {
      console.warn('Lỗi khi hợp nhất tiến độ thẻ vào IndexedDB:', err);
      return false;
    }
  }
};
