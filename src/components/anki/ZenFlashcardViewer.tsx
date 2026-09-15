import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnkiCard, AnkiDeck } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { triggerCelebrationConfetti } from '../../utils/soundEffects';
import {
  Volume2,
  X,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Brain
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ZenFlashcardViewerProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession?: () => void;
}

export const ZenFlashcardViewer: React.FC<ZenFlashcardViewerProps> = ({
  deckId,
  isOpen,
  onClose,
  onCompleteSession
}) => {
  const [deck, setDeck] = useState<AnkiDeck | null>(null);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // Thống kê phiên học
  const [rememberedCount, setRememberedCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);

  // Quản lý audio của thẻ hiện tại
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quản lý HTML đã được phân giải URL hình ảnh từ IndexedDB
  const [renderedFrontHtml, setRenderedFrontHtml] = useState<string>('');
  const [renderedBackHtml, setRenderedBackHtml] = useState<string>('');
  const activeBlobUrlsRef = useRef<string[]>([]);

  // Tải danh sách thẻ đến hạn cho phiên 2 phút (tối đa 10 thẻ)
  const loadDeckAndCards = useCallback(async () => {
    setIsLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setAgainCount(0);

    try {
      const fetchedDeck = await indexedDbService.getDeckById(deckId);
      setDeck(fetchedDeck);

      // Lấy danh sách thẻ cần ôn (tối đa 10 thẻ theo quy tắc 2 phút)
      let sessionCards = await indexedDbService.getDueCards(deckId, 10);

      // Nếu không có thẻ nào đến hạn, lấy 10 thẻ bất kỳ để người dùng ôn thêm
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
  }, [deckId]);

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
          // Tự động phát âm thanh khi vào thẻ (tùy chọn tinh tế)
          const audio = new Audio(activeUrl);
          audioRef.current = audio;
          audio.play().catch(() => {
            // Trình duyệt có thể chặn autoplay nếu chưa có tương tác
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

          const blob = await indexedDbService.getMediaBlob(filename);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrlsRef.current.push(blobUrl);
            const newImg = `<img src="${blobUrl}" alt="${filename}" class="max-w-full max-h-56 h-auto rounded-xl mx-auto my-2.5 object-contain border border-border/60 shadow-2xs block" loading="lazy" />`;
            resHtml = resHtml.replace(fullTag, newImg);
          } else {
            resHtml = resHtml.replace(fullTag, '');
          }
        }
        return resHtml;
      };

      const front = await resolveHtml(currentCard.front);
      const back = await resolveHtml(currentCard.back);

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

  // Dọn dẹp toàn bộ blob URLs khi đóng component
  useEffect(() => {
    return () => {
      activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      activeBlobUrlsRef.current = [];
    };
  }, []);

  // Hàm phát lại âm thanh
  const playAudio = () => {
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.play().catch(console.warn);
    }
  };

  // Rung phản hồi haptic trên điện thoại
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

  // Đánh giá thẻ
  const handleRate = async (remembered: boolean) => {
    triggerHaptic();
    if (!currentCard) return;

    // Cập nhật SRS vào IndexedDB
    await indexedDbService.recordCardReview(currentCard.id, remembered);

    if (remembered) {
      setRememberedCount((c) => c + 1);
    } else {
      setAgainCount((c) => c + 1);
    }

    // Chuyển thẻ tiếp theo hoặc hoàn thành
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex((i) => i + 1);
    } else {
      // Hoàn thành phiên học 2 phút!
      setIsCompleted(true);
      triggerCelebrationConfetti();
      onCompleteSession?.();
    }
  };

  // Hỗ trợ phím tắt bàn phím
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl p-5 sm:p-7 space-y-5 flex flex-col min-h-[500px]">
        {/* Header Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-sprout text-primary shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div className="truncate">
              <h3 className="font-serif text-sm font-bold text-text-primary truncate">
                {deck?.title || 'Bộ thẻ Flashcards'}
              </h3>
              <p className="text-[11px] font-mono text-text-tertiary">
                {cards.length > 0 && !isCompleted
                  ? `Thẻ ${currentIndex + 1} / ${cards.length} (Phiên 2 phút)`
                  : 'Phiên ôn tập vi mô'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung chính */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
            <RefreshCw className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-text-secondary font-medium">Đang nạp các thẻ cần ôn...</p>
          </div>
        ) : isCompleted ? (
          /* Màn hình Hoàn thành phiên học (Satisfying) */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-sprout text-primary shadow-xs">
              <Sparkles className="h-8 w-8 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-bold text-text-primary">
                Đã Hoàn Thành Phiên Ôn 2 Phút!
              </h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Bạn đã gieo thêm một hạt mầm kiên trì. Thói quen hôm nay đã được tích xanh hoàn thành!
              </p>
            </div>

            {/* Thống kê phiên */}
            <div className="flex items-center justify-center gap-6 py-2 border-y border-border-subtle w-full max-w-xs font-mono text-xs">
              <div>
                <span className="text-text-tertiary block">Đã nhớ</span>
                <span className="text-primary font-bold text-base">{rememberedCount}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="text-text-tertiary block">Cần ôn lại</span>
                <span className="text-accent-clay font-bold text-base">{againCount}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={loadDeckAndCards}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-primary hover:bg-canvas-subtle transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Ôn thêm 10 thẻ</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <span>Xong</span>
              </button>
            </div>
          </div>
        ) : currentCard ? (
          /* Trình Lật Thẻ Flashcard */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Thẻ bài (Card Canvas với hiệu ứng lật) */}
            <div
              onClick={handleFlip}
              className={cn(
                'relative flex-1 min-h-[220px] rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none',
                isFlipped
                  ? 'bg-surface border-accent-sage/40 shadow-md ring-1 ring-accent-sage/20'
                  : 'bg-canvas border-border shadow-xs hover:border-primary/40'
              )}
            >
              {/* Nhãn mặt trước / mặt sau */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-text-tertiary">
                <span className="uppercase tracking-wider">
                  {isFlipped ? 'Mặt sau (Giải nghĩa)' : 'Mặt trước (Từ khóa)'}
                </span>
                {currentAudioUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio();
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-sprout/60 px-2.5 py-1 text-primary hover:bg-accent-sprout transition-colors cursor-pointer text-xs font-medium"
                    title="Nghe phát âm (Phím R)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe</span>
                  </button>
                )}
              </div>

              {/* Nội dung trung tâm thẻ */}
              <div className="py-4 my-auto text-center space-y-3">
                {!isFlipped ? (
                  /* Mặt trước */
                  <div className="space-y-2">
                    <div
                      className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight"
                      dangerouslySetInnerHTML={{ __html: renderedFrontHtml || currentCard.front }}
                    />
                    <p className="text-[11px] text-text-tertiary italic">
                      (Chạm hoặc nhấn Phím Cách để xem đáp án)
                    </p>
                  </div>
                ) : (
                  /* Mặt sau */
                  <div className="space-y-3 text-left animate-in fade-in duration-200">
                    <div
                      className="font-serif text-xl sm:text-2xl font-bold text-primary border-b border-border-subtle pb-2"
                      dangerouslySetInnerHTML={{ __html: renderedFrontHtml || currentCard.front }}
                    />
                    <div
                      className="text-xs sm:text-sm text-text-secondary leading-relaxed space-y-2.5 max-h-[280px] overflow-y-auto pr-1"
                      dangerouslySetInnerHTML={{ __html: renderedBackHtml || currentCard.back }}
                    />
                  </div>
                )}
              </div>

              {/* Dấu hiệu gợi ý lật thẻ */}
              <div className="flex items-center justify-center text-[10px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>Chạm bất kỳ đâu để lật</span>
                </span>
              </div>
            </div>

            {/* Thanh điều khiển đánh giá (Rating Buttons) */}
            <div className="pt-2">
              {!isFlipped ? (
                <button
                  type="button"
                  onClick={handleFlip}
                  className="w-full rounded-xl bg-canvas border border-border py-3 text-xs font-semibold text-text-primary hover:bg-surface hover:border-primary/40 active:scale-98 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Xem Đáp Án (Lật Thẻ)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRate(false)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-accent-clay/30 bg-accent-clay/10 py-3 px-4 text-accent-clay hover:bg-accent-clay/20 active:scale-95 transition-all cursor-pointer font-semibold text-xs"
                  >
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Cần ôn lại</span>
                    </span>
                    <span className="text-[10px] opacity-70 font-mono font-normal">
                      (Phím 1 hoặc ←)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-accent-sage/30 bg-accent-sprout/60 py-3 px-4 text-primary hover:bg-accent-sprout active:scale-95 transition-all cursor-pointer font-semibold text-xs"
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã nhớ</span>
                    </span>
                    <span className="text-[10px] opacity-70 font-mono font-normal">
                      (Phím 2 hoặc →)
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
