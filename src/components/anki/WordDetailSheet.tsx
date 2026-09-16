import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Calendar,
  Layers,
  Sparkles,
  PenLine,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { AnkiCard, calculateCardVitality } from '../../types/anki';
import { BottomSheet } from '../BottomSheet';
import { MemoryStrengthIndicator } from './MemoryStrengthIndicator';
import { indexedDbService } from '../../services/indexedDbService';
import { useHabits } from '../../context/HabitContext';

interface WordDetailSheetProps {
  card: AnkiCard | null;
  deckTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSingle?: (cardId: string) => void;
}

/**
 * Trình xem chi tiết thẻ từ vựng (WordDetailSheet)
 * Cho phép xem chi tiết từ, nghe audio, xem chỉ số ghi nhớ Spaced Repetition,
 * và tích hợp trực tiếp với Nhật ký phản tư để thực hành đặt câu theo ngữ cảnh.
 */
export const WordDetailSheet: React.FC<WordDetailSheetProps> = ({
  card,
  deckTitle,
  isOpen,
  onClose,
  onReviewSingle
}) => {
  const { addNote } = useHabits();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [practiceSentence, setPracticeSentence] = useState('');
  const [hasSavedNote, setHasSavedNote] = useState(false);
  const [renderedBackHtml, setRenderedBackHtml] = useState('');
  const [renderedFrontHtml, setRenderedFrontHtml] = useState('');
  const activeBlobUrlsRef = useRef<string[]>([]);

  // Reset form khi đổi thẻ hoặc đóng mở
  useEffect(() => {
    if (isOpen && card) {
      setPracticeSentence('');
      setHasSavedNote(false);
    }
  }, [isOpen, card]);

  // Nạp âm thanh từ IndexedDB
  useEffect(() => {
    let currentUrl: string | null = null;
    let isMounted = true;

    async function loadAudio() {
      if (card?.audioName) {
        const blob = await indexedDbService.getMediaBlob(card.audioName);
        if (blob && isMounted) {
          currentUrl = URL.createObjectURL(blob);
          setAudioUrl(currentUrl);
        } else {
          setAudioUrl(null);
        }
      } else {
        setAudioUrl(null);
      }
    }

    loadAudio();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [card]);

  // Xử lý hình ảnh nhúng trong front & back HTML
  useEffect(() => {
    activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeBlobUrlsRef.current = [];

    if (!card) {
      setRenderedFrontHtml('');
      setRenderedBackHtml('');
      return;
    }

    let isMounted = true;

    async function resolveImages(html: string) {
      if (!html) return '';
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      const matches = Array.from(html.matchAll(imgRegex));
      if (matches.length === 0) return html;

      let resultHtml = html;
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
          const newImg = `<img src="${blobUrl}" alt="${filename}" class="max-w-full max-h-48 rounded-lg mx-auto my-2 object-contain border border-border/60 shadow-2xs block" loading="lazy" />`;
          resultHtml = resultHtml.replace(fullTag, newImg);
        } else {
          resultHtml = resultHtml.replace(fullTag, '');
        }
      }
      return resultHtml;
    }

    async function process() {
      if (!card) return;
      let front = await resolveImages(card.front);
      let back = await resolveImages(card.back);

      // Fallback an toàn: Nếu thẻ có imageName mà trong front/back chưa hiển thị
      if (card.imageName && !front.includes(card.imageName) && !back.includes(card.imageName)) {
        let blob = await indexedDbService.getMediaBlob(card.imageName);
        if (!blob) {
          try {
            blob = await indexedDbService.getMediaBlob(decodeURIComponent(card.imageName));
          } catch {}
        }
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrlsRef.current.push(blobUrl);
          const topImg = `<div class="text-center my-2.5"><img src="${blobUrl}" alt="Hình ảnh minh họa" class="max-w-full max-h-48 rounded-lg mx-auto object-contain border border-border/60 shadow-2xs block" loading="lazy" /></div>`;
          back = topImg + back;
        }
      }

      if (isMounted) {
        setRenderedFrontHtml(front);
        setRenderedBackHtml(back);
      }
    }

    process();

    return () => {
      isMounted = false;
    };
  }, [card]);

  // Dọn dẹp blob URLs
  useEffect(() => {
    return () => {
      activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      activeBlobUrlsRef.current = [];
    };
  }, []);

  if (!card) return null;

  // Lọc lấy từ vựng thuần text cho tiêu đề
  const cleanFrontText = card.front.replace(/<[^>]+>/g, '').trim();

  // Phát âm thanh
  const handlePlayAudio = () => {
    if (!audioUrl) return;
    setIsPlayingAudio(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  // Lưu câu thực hành vào Nhật ký phản tư
  const handleSaveToReflections = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceSentence.trim()) return;

    const noteContent = `🌱 Thực hành từ vựng [${cleanFrontText}]:\n"${practiceSentence.trim()}"`;
    addNote(noteContent, 'anki_vocabulary');
    setHasSavedNote(true);
    setPracticeSentence('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={<Sparkles className="h-4.5 w-4.5 text-primary" />}
      title="Chi Tiết Thẻ Từ Vựng"
      subtitle={deckTitle || 'Kho từ vựng Zen'}
      className="h-[88dvh] sm:h-auto sm:max-h-[620px]"
      contentClassName="p-4 sm:p-6 overflow-y-auto space-y-5"
    >
      {/* Khối hiển thị Từ vựng chính & Phát âm */}
      <div className="bg-canvas rounded-2xl p-4 sm:p-5 border border-border shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div
              className="text-lg sm:text-xl font-serif font-bold text-text-primary leading-snug"
              dangerouslySetInnerHTML={{ __html: renderedFrontHtml || card.front }}
            />
          </div>

          {audioUrl && (
            <button
              type="button"
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`p-2.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                isPlayingAudio
                  ? 'bg-primary text-canvas-white border-primary shadow-xs'
                  : 'bg-canvas-subtle hover:bg-canvas-muted text-primary border-border hover:border-border-strong'
              }`}
              title="Nghe phát âm"
            >
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>

        {/* Nghĩa & Giải thích mặt sau */}
        <div className="pt-3 border-t border-border-subtle/80">
          <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
            Ý nghĩa & Giải thích
          </span>
          <div
            className="text-sm text-text-secondary leading-relaxed font-sans prose-sm"
            dangerouslySetInnerHTML={{ __html: renderedBackHtml || card.back }}
          />
        </div>
      </div>

      {/* Chỉ số Ghi nhớ & Tiến trình Spaced Repetition */}
      <div className="bg-canvas-subtle rounded-2xl p-4 border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-text-tertiary" />
            Trạng thái Trí nhớ
          </span>
          <MemoryStrengthIndicator
            vitality={calculateCardVitality(card)}
            showLabel={true}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle text-xs font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <div>
              <span className="text-text-tertiary block text-[10px]">Ngày ôn tiếp</span>
              <span className="text-text-primary font-medium">{card.dueDate}</span>
            </div>
          </div>
          <div>
            <span className="text-text-tertiary block text-[10px]">Đã ôn luyện</span>
            <span className="text-text-primary font-medium">
              {card.reps} lần ({card.interval} ngày)
            </span>
          </div>
        </div>
      </div>

      {/* Hành động Thực hành: Đặt câu vào Nhật ký phản tư */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/15 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <PenLine className="h-3.5 w-3.5" />
          <span>Đặt 1 câu vào Nhật ký phản tư</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Áp dụng từ <strong>{cleanFrontText}</strong> vào một câu ngắn trong ngày để khắc sâu ngữ cảnh.
        </p>

        {hasSavedNote ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-sprout/60 text-primary border border-primary/20 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Đã ghi vào Nhật ký phản tư với thẻ #anki_vocabulary!</span>
          </div>
        ) : (
          <form onSubmit={handleSaveToReflections} className="space-y-2.5">
            <textarea
              value={practiceSentence}
              onChange={(e) => setPracticeSentence(e.target.value)}
              placeholder={`Ví dụ: I try to embrace this habit every morning...`}
              rows={2}
              className="w-full text-xs rounded-xl border border-border bg-canvas p-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none font-sans"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!practiceSentence.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-dark text-canvas-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <span>Ghi vào Nhật ký</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nút Ôn tập riêng thẻ này */}
      {onReviewSingle && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReviewSingle(card.id);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary text-canvas-white hover:bg-primary-dark text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Luyện tập ngay từ này (1 thẻ)</span>
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
