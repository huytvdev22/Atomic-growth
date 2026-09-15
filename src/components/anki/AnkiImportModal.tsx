import React, { useState, useRef } from 'react';
import { parseAnkiPackage, ParseAnkiResult } from '../../services/ankiParser';
import { indexedDbService } from '../../services/indexedDbService';
import { useHabits } from '../../context/HabitContext';
import {
  UploadCloud,
  X,
  FileCheck,
  Sparkles,
  Volume2,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface AnkiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (deckId: string) => void;
}

export const AnkiImportModal: React.FC<AnkiImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const { addHabit } = useHabits();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Kết quả parse xem trước
  const [previewResult, setPreviewResult] = useState<ParseAnkiResult | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [linkOption, setLinkOption] = useState<'create_new' | 'none'>('create_new');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setError('Vui lòng chọn tệp định dạng .apkg xuất từ Anki');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgressPercent(0);
    setProgressMessage('Đang chuẩn bị bóc tách file...');

    try {
      const result = await parseAnkiPackage(file, (percent: number, message: string) => {
        setProgressPercent(percent);
        setProgressMessage(message);
      });

      setPreviewResult(result);
      setDeckTitle(result.deck.title);

      // Nếu có audio ở thẻ đầu tiên, tạo preview audio
      if (result.cards.length > 0 && result.cards[0].audioName) {
        const firstAudio = result.mediaItems.find(
          (m) => m.id === result.cards[0].audioName
        );
        if (firstAudio) {
          setPreviewAudioUrl(URL.createObjectURL(firstAudio.blob));
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp file Anki:', err);
      setError(err?.message || 'Có lỗi xảy ra khi bóc tách tệp Anki.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAndStart = async () => {
    if (!previewResult) return;

    setIsLoading(true);
    setProgressMessage('Đang lưu trữ dữ liệu vào máy...');

    try {
      const finalDeck = {
        ...previewResult.deck,
        title: deckTitle.trim() || previewResult.deck.title
      };

      // Xử lý liên kết Thói quen
      if (linkOption === 'create_new') {
        // Tự động tạo Habit mới trên Timeline
        addHabit({
          title: `Ôn 10 thẻ: ${finalDeck.title}`,
          identityPrompt: 'Tôi là người kiên trì học hỏi và tích lũy tri thức mỗi ngày',
          ritual: 'morning',
          category: 'focus',
          twoMinuteVersion: 'Lật và ôn nhanh 5 thẻ đầu tiên trong ngày',
          temptationBundle: 'Vừa nhâm nhi cà phê sáng vừa lật thẻ nhớ'
        });
      }

      // Lưu Deck vào IndexedDB
      await indexedDbService.saveDeck(finalDeck);

      // Lưu Cards vào IndexedDB
      await indexedDbService.saveCardsBatch(previewResult.cards);

      // Lưu Media Blobs vào IndexedDB
      if (previewResult.mediaItems.length > 0) {
        await indexedDbService.saveMediaItemsBatch(previewResult.mediaItems);
      }

      // Hoàn tất
      onImportSuccess(finalDeck.id);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu bộ thẻ vào IndexedDB:', err);
      setError('Lỗi khi lưu dữ liệu: ' + (err?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewResult(null);
    setDeckTitle('');
    setError(null);
    setIsLoading(false);
    setProgressPercent(0);
    setProgressMessage('');
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }
  };

  const playPreviewAudio = () => {
    if (previewAudioUrl) {
      const audio = new Audio(previewAudioUrl);
      audio.play().catch(console.warn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-sprout text-primary shadow-2xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-text-primary">
                Nhập Bộ Thẻ Từ Anki
              </h2>
              <p className="text-xs text-text-secondary">
                Tích hợp flashcard vào nhịp sinh học theo quy tắc 2 phút
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="rounded-full p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lỗi cảnh báo nếu có */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-accent-clay/30 bg-accent-clay/10 p-3.5 text-xs text-accent-clay">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Trạng thái 1: Kéo thả file chưa nạp */}
        {!previewResult && !isLoading && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-primary bg-accent-sprout/20 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-canvas-subtle'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".apkg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas border border-border text-primary group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              <UploadCloud className="h-6 w-6 stroke-[1.8]" />
            </div>
            <p className="font-serif text-sm font-semibold text-text-primary">
              Kéo thả file <span className="font-mono text-primary font-bold">.apkg</span> vào đây
            </p>
            <p className="text-xs text-text-tertiary mt-1 max-w-xs">
              Hoặc bấm để chọn tệp từ thiết bị của bạn (hỗ trợ đầy đủ audio và hình ảnh đính kèm)
            </p>
          </div>
        )}

        {/* Trạng thái 2: Đang bóc tách dữ liệu */}
        {isLoading && (
          <div className="rounded-xl border border-border bg-canvas p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-sm font-semibold text-text-primary">
                {progressMessage || 'Đang xử lý...'}
              </p>
              <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="font-mono text-xs text-text-tertiary">{progressPercent}%</p>
            </div>
          </div>
        )}

        {/* Trạng thái 3: Xem trước (Preview) sau khi bóc tách */}
        {previewResult && !isLoading && (
          <div className="space-y-4">
            <div className="rounded-xl border border-accent-sage/30 bg-accent-sprout/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Đã bóc tách thành công bộ thẻ</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                  Tên bộ thẻ hiển thị:
                </label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:border-primary font-medium text-text-primary"
                />
              </div>

              <div className="flex gap-4 text-xs font-mono text-text-secondary pt-1">
                <span>
                  Tổng số thẻ: <strong className="text-primary font-bold">{previewResult.cards.length}</strong>
                </span>
                <span>
                  Tệp âm thanh/ảnh: <strong className="text-primary font-bold">{previewResult.mediaItems.length}</strong>
                </span>
              </div>
            </div>

            {/* Mẫu thử thẻ đầu tiên */}
            {previewResult.cards.length > 0 && (
              <div className="rounded-xl border border-border bg-canvas p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-text-tertiary">
                  <span>Xem trước thẻ mẫu (Thẻ 1/{previewResult.cards.length}):</span>
                  {previewAudioUrl && (
                    <button
                      type="button"
                      onClick={playPreviewAudio}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-[11px] font-medium cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe phát âm</span>
                    </button>
                  )}
                </div>
                <div className="rounded-lg bg-surface border border-border p-3 space-y-1.5">
                  <div className="font-serif text-sm font-bold text-text-primary">
                    {previewResult.cards[0].front}
                  </div>
                  <div
                    className="text-xs text-text-secondary leading-relaxed border-t border-border-subtle pt-1.5"
                    dangerouslySetInnerHTML={{ __html: previewResult.cards[0].back }}
                  />
                </div>
              </div>
            )}

            {/* Tùy chọn gắn với Thói Quen (Atomic Habit Integration) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-text-secondary">
                Liên kết thói quen ôn tập hàng ngày:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="linkOption"
                    checked={linkOption === 'create_new'}
                    onChange={() => setLinkOption('create_new')}
                    className="accent-primary"
                  />
                  <span>Tự động tạo thói quen mới trên Timeline (Buổi sáng, 2 phút)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="linkOption"
                    checked={linkOption === 'none'}
                    onChange={() => setLinkOption('none')}
                    className="accent-primary"
                  />
                  <span>Chỉ lưu vào Góc Ôn Tập (tự ôn theo nhu cầu)</span>
                </label>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-text-secondary hover:bg-canvas-subtle transition-colors cursor-pointer"
              >
                Hủy & Chọn file khác
              </button>
              <button
                type="button"
                onClick={handleSaveAndStart}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Bắt Đầu Học</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
