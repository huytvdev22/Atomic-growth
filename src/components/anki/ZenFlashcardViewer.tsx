import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnkiCard, AnkiDeck } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { ankiFirestoreSync } from '../../services/ankiFirestoreSync';
import { predictNextInterval, recordDeckStudySession } from '../../utils/deckAnalytics';
import { useAuth } from '../../context/AuthContext';
import { triggerCelebrationConfetti } from '../../utils/soundEffects';
import { BottomSheet } from '../BottomSheet';
import {
  Volume2,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Brain,
  Undo2
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ZenFlashcardViewerProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession?: () => void;
  targetCardIds?: string[];
  customSubtitle?: string;
}

/**
 * Component Trình Lật Thẻ Zen 2.0 (ZenFlashcardViewer)
 * Trải nghiệm ôn tập tĩnh lặng, tập trung sâu theo triết lý Atomic Habits:
 * - Hàng chấm hạt mầm vi mô (Seedling Dots) trực quan hóa tiến độ
 * - Dự báo thời gian lặp lại SRS (Next Interval Preview) 1-tap
 * - Phát âm đa phương tiện thông minh (IndexedDB Audio + TTS Web Speech API dự phòng)
 * - Cử chỉ lật thẻ & vuốt đánh giá mượt mà trên thiết bị di động
 */
export const ZenFlashcardViewer: React.FC<ZenFlashcardViewerProps> = ({
  deckId,
  isOpen,
  onClose,
  onCompleteSession,
  targetCardIds,
  customSubtitle
}) => {
  const { user } = useAuth();
  const [deck, setDeck] = useState<AnkiDeck | null>(null);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // Thống kê phiên học & lịch sử kết quả từng thẻ trong phiên
  const [rememberedCount, setRememberedCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [cardResults, setCardResults] = useState<Record<number, 'remembered' | 'again'>>({});

  // Quản lý audio của thẻ hiện tại
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quản lý HTML đã được phân giải URL hình ảnh từ IndexedDB
  const [renderedFrontHtml, setRenderedFrontHtml] = useState<string>('');
  const [renderedBackHtml, setRenderedBackHtml] = useState<string>('');
  const activeBlobUrlsRef = useRef<string[]>([]);

  // Tải danh sách thẻ đến hạn cho phiên 2 phút (hoặc theo danh sách targetCardIds)
  const loadDeckAndCards = useCallback(async () => {
    setIsLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setAgainCount(0);
    setCardResults({});

    try {
      const fetchedDeck = await indexedDbService.getDeckById(deckId);
      setDeck(fetchedDeck);

      let sessionCards: AnkiCard[] = [];

      // Nếu có danh sách thẻ mục tiêu (Ví dụ: 5 từ Fragile cần ôn cấp bách)
      if (targetCardIds && targetCardIds.length > 0) {
        const allCards = await indexedDbService.getCardsByDeckId(deckId);
        const targetSet = new Set(targetCardIds);
        sessionCards = allCards.filter((c) => targetSet.has(c.id));
      }

      // Nếu không có mục tiêu cụ thể, lấy danh sách thẻ đến hạn theo SRS (tối đa 10 thẻ)
      if (sessionCards.length === 0) {
        sessionCards = await indexedDbService.getDueCards(deckId, 10);
      }

      // Nếu vẫn không có thẻ nào đến hạn, lấy 10 thẻ bất kỳ để người dùng ôn thêm
      if (sessionCards.length === 0) {
        const allCards = await indexedDbService.getCardsByDeckId(deckId);
        sessionCards = allCards.slice(0, 10);
      }

      setCards(sessionCards);
    } catch (err) {
      console.error('Lỗi khi tải thẻ từ IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deckId, targetCardIds]);

  useEffect(() => {
    if (isOpen && deckId) {
      loadDeckAndCards();
    }
  }, [isOpen, deckId, loadDeckAndCards]);

  const currentCard: AnkiCard | undefined = cards[currentIndex];

  // Nạp âm thanh của thẻ hiện tại khi chuyển thẻ
  useEffect(() => {
    let activeUrl: string | null = null;

    async function loadAudio() {
      if (currentCard && currentCard.audioName) {
        const blob = await indexedDbService.getMediaBlob(currentCard.audioName);
        if (blob) {
          activeUrl = URL.createObjectURL(blob);
          setCurrentAudioUrl(activeUrl);
          // Tự động phát âm thanh khi vào thẻ
          const audio = new Audio(activeUrl);
          audioRef.current = audio;
          audio.play().catch(() => {
            // Trình duyệt có thể chặn autoplay nếu chưa có tương tác người dùng
          });
        } else {
          setCurrentAudioUrl(null);
        }
      } else {
        setCurrentAudioUrl(null);
      }
    }

    loadAudio();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [currentCard]);

  // Phân giải các thẻ ảnh <img src="..."> sang Blob URL từ IndexedDB
  useEffect(() => {
    activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeBlobUrlsRef.current = [];

    if (!currentCard) {
      setRenderedFrontHtml('');
      setRenderedBackHtml('');
      return;
    }

    let isMounted = true;

    async function processCardImages() {
      if (!currentCard) return;

      const resolveHtml = async (html: string) => {
        if (!html) return '';
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        const matches = Array.from(html.matchAll(imgRegex));
        if (matches.length === 0) return html;

        let resHtml = html;
        for (const match of matches) {
          const fullTag = match[0];
          const filename = match[1];
          if (/^(https?:|data:|blob:)/i.test(filename)) continue;

          let blob = await indexedDbService.getMediaBlob(filename);
          if (!blob) {
            try {
              blob = await indexedDbService.getMediaBlob(decodeURIComponent(filename));
            } catch {}
          }
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrlsRef.current.push(blobUrl);
            const newImg = `<img src="${blobUrl}" alt="${filename}" class="max-w-full max-h-52 sm:max-h-56 h-auto rounded-xl mx-auto my-2.5 object-contain border border-border/60 shadow-2xs block" loading="lazy" />`;
            resHtml = resHtml.replace(fullTag, newImg);
          } else {
            resHtml = resHtml.replace(fullTag, '');
          }
        }
        return resHtml;
      };

      let front = await resolveHtml(currentCard.front);
      let back = await resolveHtml(currentCard.back);

      // Fallback an toàn: Nếu thẻ có imageName mà trong cả front lẫn back chưa có ảnh nào hiển thị
      if (
        currentCard.imageName &&
        !front.includes(currentCard.imageName) &&
        !back.includes(currentCard.imageName)
      ) {
        let blob = await indexedDbService.getMediaBlob(currentCard.imageName);
        if (!blob) {
          try {
            blob = await indexedDbService.getMediaBlob(decodeURIComponent(currentCard.imageName));
          } catch {}
        }
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrlsRef.current.push(blobUrl);
          const topImg = `<div class="text-center my-3"><img src="${blobUrl}" alt="Hình ảnh minh họa" class="max-w-full max-h-52 sm:max-h-56 h-auto rounded-xl mx-auto object-contain border border-border/60 shadow-2xs block" loading="lazy" /></div>`;
          back = topImg + back;
        }
      }

      if (isMounted) {
        setRenderedFrontHtml(front);
        setRenderedBackHtml(back);
      }
    }

    processCardImages();

    return () => {
      isMounted = false;
    };
  }, [currentCard]);

  // Dọn dẹp toàn bộ blob URLs khi unmount
  // Dọn dẹp toàn bộ blob URLs khi unmount
  useEffect(() => {
    return () => {
      activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      activeBlobUrlsRef.current = [];
    };
  }, []);

  // Hàm phát âm thanh (Ưu tiên tệp âm thanh gốc, nếu không có sẽ tự động dùng Web Speech TTS)
  const playAudio = () => {
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.play().catch(console.warn);
      return;
    }

    // Dự phòng bằng Web Speech API (TTS) nếu không có tệp audio
    if (currentCard && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const plainText = currentCard.front
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (plainText) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Cử chỉ vuốt thẻ dạng Smooth Carousel 2 chiều phẳng (Zero React Re-renders, không xoay cong)
  const cardElementRef = useRef<HTMLDivElement>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const currentDeltaXRef = useRef<number>(0);
  const currentDeltaYRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);
  const ignoreNextClickRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Đưa style của thẻ về trạng thái cân bằng
  const resetCardStyles = useCallback((withTransition = true) => {
    const el = cardElementRef.current;
    if (!el) return;
    if (withTransition) {
      el.style.transition = 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s, border-color 0.2s';
    } else {
      el.style.transition = 'none';
    }
    el.style.setProperty('--swipe-x', '0px');
    el.style.setProperty('--stamp-right-op', '0');
    el.style.setProperty('--stamp-left-op', '0');
    el.style.setProperty('--card-opacity', '1');
    el.style.borderColor = '';
    el.style.opacity = '1';
  }, []);

  // Cập nhật biến CSS trực tiếp lên phần tử DOM qua requestAnimationFrame (Hoàn toàn phẳng, 0 xoay cong)
  const updateCardTransform = useCallback(() => {
    const el = cardElementRef.current;
    if (!el) return;
    const deltaX = currentDeltaXRef.current;
    const absX = Math.abs(deltaX);

    // Di chuyển phẳng tịnh tiến 1:1 theo trục X
    el.style.setProperty('--swipe-x', `${deltaX}px`);

    // Độ mờ nhẹ khi kéo sang hai bên (từ 1.0 xuống tối đa 0.75)
    const cardOp = Math.max(0.75, 1 - (absX / 600));
    el.style.setProperty('--card-opacity', `${cardOp}`);

    if (isFlipped) {
      if (deltaX > 15) {
        // Kéo sang phải: Đã nhớ
        const op = Math.min(1, (deltaX - 15) / 45);
        el.style.setProperty('--stamp-right-op', `${op}`);
        el.style.setProperty('--stamp-left-op', '0');
        el.style.borderColor = deltaX > 25 ? 'rgba(82, 139, 112, 0.85)' : '';
      } else if (deltaX < -15) {
        // Kéo sang trái: Cần ôn lại
        const op = Math.min(1, (-deltaX - 15) / 45);
        el.style.setProperty('--stamp-left-op', `${op}`);
        el.style.setProperty('--stamp-right-op', '0');
        el.style.borderColor = deltaX < -25 ? 'rgba(201, 114, 85, 0.85)' : '';
      } else {
        el.style.setProperty('--stamp-right-op', '0');
        el.style.setProperty('--stamp-left-op', '0');
        el.style.borderColor = '';
      }
    } else {
      el.style.borderColor = '';
    }
  }, [isFlipped]);

  const handleCardTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStartXRef.current = touch.clientX;
    swipeStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
    currentDeltaXRef.current = 0;
    currentDeltaYRef.current = 0;
    isSwipingRef.current = true;

    if (cardElementRef.current) {
      cardElementRef.current.style.transition = 'none';
    }
  };

  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || swipeStartXRef.current === null || swipeStartYRef.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartXRef.current;
    const deltaY = touch.clientY - swipeStartYRef.current;

    currentDeltaXRef.current = deltaX;
    currentDeltaYRef.current = deltaY;

    // Nếu dịch chuyển ngón tay quá 6px, đánh dấu để chặn sự kiện click giả lập của trình duyệt
    if (Math.hypot(deltaX, deltaY) > 6) {
      ignoreNextClickRef.current = true;
    }

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        updateCardTransform();
        rafIdRef.current = null;
      });
    }
  };

  const handleCardTouchEnd = () => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const duration = Date.now() - touchStartTimeRef.current;
    const deltaX = currentDeltaXRef.current;
    const deltaY = currentDeltaYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const totalDist = Math.hypot(deltaX, deltaY);

    // KỊCH BẢN 1: CHẠM (TAP) ĐỂ LẬT THẺ
    // Chạm nhanh (< 280ms) và hầu như không di chuyển (< 12px)
    if (duration < 280 && totalDist < 12) {
      ignoreNextClickRef.current = true;
      resetCardStyles(false);
      handleFlip();
      swipeStartXRef.current = null;
      swipeStartYRef.current = null;
      currentDeltaXRef.current = 0;
      currentDeltaYRef.current = 0;
      return;
    }

    // KỊCH BẢN 2: TRƯỢT THẺ Ở MẶT SAU (SWIPE CAROUSEL TRANSITION)
    if (isFlipped && absX > 55 && absX > absY * 1.1) {
      ignoreNextClickRef.current = true;
      const el = cardElementRef.current;
      const isRight = deltaX > 0;

      // Hiệu ứng Smooth Carousel: lướt phẳng ngang sang một bên (180ms)
      if (el) {
        el.style.transition = 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.18s ease-out';
        el.style.setProperty('--swipe-x', isRight ? '105%' : '-105%');
        el.style.opacity = '0';
      }

      setTimeout(() => {
        // Đặt thẻ mới ở phía đối diện rồi lướt êm vào tâm
        resetCardStyles(false);
        if (el) {
          el.style.setProperty('--swipe-x', isRight ? '-40px' : '40px');
          el.style.opacity = '0';
          // Kích hoạt animation slide-in vào tâm
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease-out';
            el.style.setProperty('--swipe-x', '0px');
            el.style.opacity = '1';
          });
        }
        handleRate(isRight);
      }, 180);
    } else {
      // Dưới ngưỡng hoặc vuốt ở mặt trước: lướt đàn hồi nhẹ nhàng quay về tâm, KHÔNG lật thẻ
      resetCardStyles(true);
    }

    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    currentDeltaXRef.current = 0;
    currentDeltaYRef.current = 0;
  };

  // Xử lý Click cho chuột Desktop (trên Mobile, tap đã được xử lý 100% trong onTouchEnd)
  const handleCardClick = () => {
    // Ngăn chặn các sự kiện click giả lập từ touch di động
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    handleFlip();
  };

  // Reset vị trí thẻ khi chuyển sang thẻ mới
  useEffect(() => {
    resetCardStyles(false);
  }, [currentIndex, resetCardStyles]);

  // Hủy RAF khi unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Rung phản hồi haptic trên thiết bị di động
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Lật thẻ
  const handleFlip = () => {
    triggerHaptic();
    setIsFlipped((prev) => !prev);
  };

  // Quay lại thẻ trước đó (Undo / Previous Card)
  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      triggerHaptic();
      const prevIndex = currentIndex - 1;
      setIsFlipped(false);
      resetCardStyles(false);
      setCurrentIndex(prevIndex);
    }
  };

  // Nhảy trực tiếp đến thẻ bất kỳ từ thanh tiến độ
  const handleJumpToCard = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < cards.length && targetIndex !== currentIndex) {
      triggerHaptic();
      setIsFlipped(false);
      resetCardStyles(false);
      setCurrentIndex(targetIndex);
    }
  };

  // Đánh giá thẻ và chuyển thẻ tiếp theo
  const handleRate = async (remembered: boolean) => {
    triggerHaptic();
    if (!currentCard) return;

    // Kiểm tra xem thẻ này đã từng được đánh giá trước đó chưa (trong trường hợp quay lại sửa kết quả)
    const prevEvaluation = cardResults[currentIndex];
    if (prevEvaluation === 'remembered' && !remembered) {
      setRememberedCount((c) => Math.max(0, c - 1));
      setAgainCount((c) => c + 1);
    } else if (prevEvaluation === 'again' && remembered) {
      setAgainCount((c) => Math.max(0, c - 1));
      setRememberedCount((c) => c + 1);
    } else if (!prevEvaluation) {
      if (remembered) {
        setRememberedCount((c) => c + 1);
      } else {
        setAgainCount((c) => c + 1);
      }
    }

    // Lưu kết quả của thẻ hiện tại để hiển thị trên thanh tiến độ
    setCardResults((prev) => ({
      ...prev,
      [currentIndex]: remembered ? 'remembered' : 'again'
    }));

    // Cập nhật SRS vào IndexedDB
    await indexedDbService.recordCardReview(currentCard.id, remembered);

    // Chuyển thẻ tiếp theo hoặc hoàn thành phiên
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      resetCardStyles(false);
      setCurrentIndex((i) => i + 1);
    } else {
      // Hoàn thành phiên học 2 phút
      setIsCompleted(true);
      triggerCelebrationConfetti();

      // Ghi nhận phiên ôn tập vào lịch sử của bộ thẻ (để vẽ Mini Garden Heatmap)
      recordDeckStudySession(deckId, cards.length);
      indexedDbService.updateDeckLastReviewed(deckId).catch(console.warn);

      onCompleteSession?.();

      // Tự động đồng bộ tiến độ ghi nhớ lên Cloud Firestore nếu đã đăng nhập
      if (user?.uid && deckId) {
        ankiFirestoreSync.syncDeckProgressToFirestore(user.uid, deckId);
      }
    }
  };

  // Hỗ trợ phím tắt bàn phím (Desktop)
  useEffect(() => {
    if (!isOpen || isCompleted || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        if (isFlipped) handleRate(false);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        if (isFlipped) handleRate(true);
      } else if (e.key === 'r' || e.key === 'R') {
        playAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCompleted, currentCard, isFlipped]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={<Brain className="h-4.5 w-4.5" />}
      title={deck?.title || 'Bộ thẻ Flashcards'}
      subtitle={
        customSubtitle
          ? `${customSubtitle} (${cards.length > 0 && !isCompleted ? `${currentIndex + 1}/${cards.length}` : 'Hoàn thành'})`
          : cards.length > 0 && !isCompleted
          ? `Thẻ ${currentIndex + 1} / ${cards.length} (Phiên 2 phút)`
          : 'Phiên ôn tập vi mô'
      }
      headerExtra={
        <div className="w-full px-1 py-1">
          {/* Hàng thanh tiến độ trạng thái DUY NHẤT (Segmented Status Bar) */}
          {cards.length > 0 && !isCompleted && (
            <div className="flex items-center justify-between gap-3">

              {/* Các chấm trạng thái đúng/sai có thể click để điều hướng */}
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1 overflow-x-auto scrollbar-none px-1">
                {cards.map((_, idx) => {
                  const result = cardResults[idx];
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToCard(idx)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-200 cursor-pointer',
                        isCurrent
                          ? 'w-7 sm:w-8 bg-primary ring-2 ring-primary/20 shadow-2xs'
                          : result === 'remembered'
                          ? 'w-2.5 sm:w-3 bg-accent-sprout hover:scale-125'
                          : result === 'again'
                          ? 'w-2.5 sm:w-3 bg-accent-clay hover:scale-125'
                          : 'w-2.5 sm:w-3 bg-border-subtle hover:bg-border'
                      )}
                      title={`Thẻ ${idx + 1}: ${
                        result === 'remembered'
                          ? 'Đã nhớ (Xanh)'
                          : result === 'again'
                          ? 'Cần ôn lại (Đỏ)'
                          : isCurrent
                          ? 'Đang học'
                          : 'Chưa học'
                      } (Bấm để nhảy đến thẻ này)`}
                    />
                  );
                })}
              </div>

              {/* Chỉ báo số thứ tự thẻ */}
              <div className="font-mono text-xs font-semibold text-text-tertiary shrink-0">
                <span className="text-primary font-bold">{currentIndex + 1}</span>
                <span>/{cards.length}</span>
              </div>
            </div>
          )}
        </div>
      }
      className="h-[92dvh] sm:h-auto sm:max-h-[640px] sm:min-h-[520px]"
      contentClassName="p-4 sm:p-6 overflow-hidden flex flex-col flex-1 space-y-0"
    >
      {isLoading ? (
        /* Trạng thái nạp thẻ */
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-text-secondary font-medium">
            Đang nạp các thẻ cần ôn...
          </p>
        </div>
      ) : isCompleted ? (
        /* Màn hình Hoàn thành phiên học (Satisfying) */
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-6 animate-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-sprout text-primary shadow-xs shrink-0">
            <Sparkles className="h-8 w-8 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
              Đã Hoàn Thành Phiên Ôn 2 Phút!
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
              Bạn đã gieo thêm một hạt mầm kiên trì. Thói quen hôm nay đã được tích xanh hoàn thành!
            </p>
          </div>

          {/* Thống kê phiên */}
          <div className="flex items-center justify-center gap-8 py-3 border-y border-border-subtle w-full max-w-xs font-mono text-xs">
            <div>
              <span className="text-text-tertiary block text-[11px] mb-0.5">Đã nhớ</span>
              <span className="text-primary font-bold text-lg">{rememberedCount}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-text-tertiary block text-[11px] mb-0.5">Cần ôn lại</span>
              <span className="text-accent-clay font-bold text-lg">{againCount}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-3 w-full max-w-xs justify-center">
            <button
              type="button"
              onClick={loadDeckAndCards}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-canvas-subtle transition-all cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Ôn thêm 10 thẻ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>Xong</span>
            </button>
          </div>
        </div>
      ) : currentCard ? (
        /* Trình Lật Thẻ Flashcard */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Khung thẻ bài (Card Canvas với Smooth Horizontal Carousel phẳng) */}
          <div
            ref={cardElementRef}
            onClick={handleCardClick}
            onTouchStart={handleCardTouchStart}
            onTouchMove={handleCardTouchMove}
            onTouchEnd={handleCardTouchEnd}
            style={{
              transform: 'translate3d(var(--swipe-x, 0px), 0, 0)',
              opacity: 'var(--card-opacity, 1)',
              willChange: 'transform, opacity',
              touchAction: 'pan-y'
            } as React.CSSProperties}
            className={cn(
              'relative flex-1 rounded-2xl border p-4 sm:p-6 flex flex-col justify-between cursor-pointer select-none overflow-hidden',
              isFlipped
                ? 'bg-surface border-accent-sage/40 shadow-md ring-1 ring-accent-sage/20'
                : 'bg-canvas border-border shadow-xs hover:border-primary/40'
            )}
          >
            {/* CON DẤU THỊ GIÁC PHẲNG (FLAT STAMP BADGES) */}
            {/* 1. Stamp ĐÃ NHỚ khi vuốt sang phải */}
            {isFlipped && (
              <div
                className="absolute top-4 left-4 z-30 pointer-events-none border-2 border-primary bg-accent-sprout/95 text-primary px-3 py-1.5 rounded-xl font-bold font-serif text-xs sm:text-sm tracking-wider uppercase shadow-md flex items-center gap-1.5 transition-opacity duration-75"
                style={{
                  opacity: 'var(--stamp-right-op, 0)'
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>ĐÃ NHỚ</span>
              </div>
            )}

            {/* 2. Stamp CẦN ÔN LẠI khi vuốt sang trái */}
            {isFlipped && (
              <div
                className="absolute top-4 right-4 z-30 pointer-events-none border-2 border-accent-clay bg-accent-clay/95 text-white px-3 py-1.5 rounded-xl font-bold font-serif text-xs sm:text-sm tracking-wider uppercase shadow-md flex items-center gap-1.5 transition-opacity duration-75"
                style={{
                  opacity: 'var(--stamp-left-op, 0)'
                }}
              >
                <AlertCircle className="w-4 h-4 text-white" />
                <span>CẦN ÔN LẠI</span>
              </div>
            )}

            {/* Nhãn mặt trước / mặt sau & Nút âm thanh */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-text-tertiary shrink-0 mb-2">
              <span className="uppercase tracking-wider">
                {isFlipped ? 'Mặt sau (Giải nghĩa)' : 'Mặt trước (Từ khóa)'}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className="inline-flex items-center gap-1 rounded-full bg-accent-sprout/60 px-3 py-1 text-primary hover:bg-accent-sprout active:scale-95 transition-all cursor-pointer text-xs font-medium"
                title="Nghe phát âm (Phím R)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe</span>
              </button>
            </div>

            {/* Nội dung trung tâm thẻ - Cuộn mượt mà độc lập khi nội dung dài */}
            <div className="flex-1 overflow-y-auto my-auto flex flex-col justify-center text-center px-1 py-2">
              {!isFlipped ? (
                /* Mặt trước */
                <div className="space-y-3 py-4">
                  <div
                    className="text-2xl sm:text-3xl text-text-primary tracking-tight font-serif font-bold"
                    dangerouslySetInnerHTML={{
                      __html: renderedFrontHtml || currentCard.front
                    }}
                  />
                  <p className="text-[11px] text-text-tertiary italic">
                    (Chạm vào thẻ hoặc bấm nút dưới để xem đáp án)
                  </p>
                </div>
              ) : (
                /* Mặt sau */
                <div className="space-y-3 text-left animate-in fade-in duration-200">
                  <div
                    className="font-serif text-lg sm:text-xl font-bold text-primary border-b border-border-subtle pb-2"
                    dangerouslySetInnerHTML={{
                      __html: renderedFrontHtml || currentCard.front
                    }}
                  />
                  <div
                    className="text-xs sm:text-sm text-text-secondary leading-relaxed space-y-2.5 max-h-[42dvh] sm:max-h-[280px] overflow-y-auto pr-1"
                    dangerouslySetInnerHTML={{
                      __html: renderedBackHtml || currentCard.back
                    }}
                  />
                </div>
              )}
            </div>

            {/* Dấu hiệu gợi ý lật thẻ & vuốt */}
            <div className="flex items-center justify-center text-[10px] text-text-tertiary shrink-0 pt-2 border-t border-border-subtle/40 mt-2">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                <span>
                  {isFlipped
                    ? 'Vuốt phẳng trái: Cần ôn lại  •  Vuốt phẳng phải: Đã nhớ'
                    : 'Chạm nhẹ vào thẻ để xem đáp án'}
                </span>
              </span>
            </div>
          </div>

          {/* Thanh điều khiển đánh giá (Rating Buttons) - Sát ngón cái ở đáy Bottom Sheet */}
          <div className="pt-3.5 shrink-0">
            {!isFlipped ? (
              <div className="flex items-center gap-2.5">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePreviousCard}
                    className="p-3 rounded-xl border border-border bg-canvas text-text-secondary hover:text-primary hover:border-primary/40 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
                    title="Quay lại thẻ trước đó"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFlip}
                  className="flex-1 rounded-xl bg-canvas border border-border py-3.5 sm:py-3 text-xs sm:text-sm font-semibold text-text-primary hover:bg-surface hover:border-primary/40 active:scale-98 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Xem Đáp Án (Lật Thẻ)</span>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePreviousCard}
                    className="p-3 rounded-xl border border-border bg-canvas text-text-secondary hover:text-primary hover:border-primary/40 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
                    title="Quay lại thẻ trước đó"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRate(false)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-accent-clay/30 bg-accent-clay/10 py-2.5 sm:py-3 px-3 text-accent-clay hover:bg-accent-clay/20 active:scale-95 transition-all cursor-pointer font-semibold text-xs sm:text-sm shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Cần ôn lại</span>
                  </span>
                  <span className="text-[10px] opacity-80 font-mono font-medium">
                    (1 ngày • Vuốt trái)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-accent-sage/30 bg-accent-sprout/70 py-2.5 sm:py-3 px-3 text-primary hover:bg-accent-sprout active:scale-95 transition-all cursor-pointer font-semibold text-xs sm:text-sm shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã nhớ</span>
                  </span>
                  <span className="text-[10px] opacity-80 font-mono font-medium">
                    ({predictNextInterval(currentCard, true)} • Vuốt phải)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </BottomSheet>
  );
};
