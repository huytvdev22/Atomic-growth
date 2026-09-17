import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnkiDeck } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';
import { googleDriveService, DriveDeckItem, GoogleDriveAuthError } from '../../services/googleDriveService';
import { ZenFlashcardViewer } from './ZenFlashcardViewer';
import { DriveSyncModal } from './DriveSyncModal';
import { DeckWordsModal } from './DeckWordsModal';
import { DeckDashboardView } from './DeckDashboardView';
import { DeckLexiconView } from './DeckLexiconView';
import { cn } from '../../utils/cn';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Sparkles,
  BookOpen,
  Cloud,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Loader2,
  BarChart3,
  List
} from 'lucide-react';

interface FlashcardsTabProps {
  onSessionCompleted?: (deckId: string) => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ onSessionCompleted }) => {
  const { driveToken, requestDriveAccess, clearDriveToken } = useAuth();
  const {
    setActiveTab,
    flashcardsResetKey,
    activeReviewDeckId: contextReviewDeckId,
    clearDeckReview
  } = useHabits();

  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Danh sách tệp trên Google Drive
  const [driveItems, setDriveItems] = useState<DriveDeckItem[]>([]);
  const [syncingDeckId, setSyncingDeckId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // File picker cho các bộ thẻ cũ chưa lưu file gốc vào IndexedDB
  const legacyFileInputRef = useRef<HTMLInputElement>(null);
  const [legacyDeckTarget, setLegacyDeckTarget] = useState<AnkiDeck | null>(null);

  // Modal quản lý & Điều hướng Sub-view
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeReviewDeckId, setActiveReviewDeckId] = useState<string | null>(null);
  const [reviewTargetCardIds, setReviewTargetCardIds] = useState<string[] | undefined>(undefined);
  const [reviewCustomSubtitle, setReviewCustomSubtitle] = useState<string | undefined>(undefined);
  const [activeWordsDeckId, setActiveWordsDeckId] = useState<string | null>(null);
  const [selectedDashboardDeckId, setSelectedDashboardDeckId] = useState<string | null>(null);
  const [selectedLexiconDeckId, setSelectedLexiconDeckId] = useState<string | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState<number>(0);

  // Tải danh sách bộ thẻ từ IndexedDB
  const loadDecks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDecks = await indexedDbService.getAllDecks();
      setDecks(fetchedDecks);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bộ thẻ:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Khi người dùng bấm vào tab Ôn tập từ Bottom Navigation hoặc bất cứ đâu: Luôn thoát các màn con và reset về danh sách bộ thẻ ngoài cùng
  useEffect(() => {
    if (flashcardsResetKey > 0) {
      setSelectedDashboardDeckId(null);
      setSelectedLexiconDeckId(null);
      setActiveReviewDeckId(null);
      setActiveWordsDeckId(null);
      loadDecks();
    }
  }, [flashcardsResetKey, loadDecks]);

  // Lắng nghe yêu cầu mở phiên ôn tập trực tiếp từ Timeline / HabitCard
  useEffect(() => {
    if (contextReviewDeckId) {
      setActiveReviewDeckId(contextReviewDeckId);
      clearDeckReview();
    }
  }, [contextReviewDeckId, clearDeckReview]);

  // Tải danh sách tệp từ Google Drive (thư mục Atomic Growth/Anki Decks/)
  const refreshDriveList = useCallback(async (token: string) => {
    try {
      const items = await googleDriveService.listDecksOnDrive(token);
      setDriveItems(items);
    } catch (err: any) {
      console.warn('Không thể nạp danh sách tệp Google Drive:', err);
      if (err instanceof GoogleDriveAuthError || err?.message?.includes('401')) {
        clearDriveToken();
      }
    }
  }, [clearDriveToken]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    if (driveToken) {
      refreshDriveList(driveToken);
    } else {
      setDriveItems([]);
    }
  }, [driveToken, refreshDriveList]);

  const handleDeleteDeck = async (deckId: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${title}" và toàn bộ tệp âm thanh đi kèm?`)) {
      try {
        await indexedDbService.deleteDeck(deckId);
        await loadDecks();
      } catch (err) {
        console.error('Lỗi khi xóa deck:', err);
      }
    }
  };

  /**
   * Tải bộ thẻ lên Google Drive (kèm cơ chế tự động khôi phục khi Token hết hạn)
   */
  const uploadDeckToDrive = async (
    deck: AnkiDeck,
    file: Blob | File,
    filename: string,
    token: string
  ) => {
    setSyncingDeckId(deck.id);
    setSyncProgress(0);
    try {
      const fileId = await googleDriveService.uploadDeckFile(
        token,
        file,
        filename,
        (percent) => setSyncProgress(percent)
      );

      // Cập nhật metadata của deck trong IndexedDB
      const updatedDeck: AnkiDeck = {
        ...deck,
        driveFileId: fileId,
        driveFileName: filename,
        driveSyncedAt: new Date().toISOString()
      };
      await indexedDbService.saveDeck(updatedDeck);
      await loadDecks();
      await refreshDriveList(token);
    } catch (err: any) {
      console.error('Lỗi khi sao lưu bộ thẻ lên Google Drive:', err);
      if (err instanceof GoogleDriveAuthError || err?.message?.includes('401')) {
        clearDriveToken();
        const shouldReauth = window.confirm(
          'Phiên làm việc Google Drive đã hết hạn (sau 1 giờ bảo mật của Google OAuth).\n\nBạn có muốn đăng nhập lại Google Drive để tiếp tục sao lưu bộ thẻ này ngay bây giờ không?'
        );
        if (shouldReauth) {
          try {
            const newToken = await requestDriveAccess();
            await uploadDeckToDrive(deck, file, filename, newToken);
            return;
          } catch (reAuthErr: any) {
            console.error('Không thể làm mới quyền Google Drive:', reAuthErr);
            alert('Không thể xác thực lại với Google: ' + (reAuthErr?.message || 'Đã hủy thao tác'));
          }
        }
      } else {
        alert('Không thể sao lưu lên Google Drive: ' + (err?.message || 'Có lỗi xảy ra'));
      }
    } finally {
      setSyncingDeckId(null);
      setSyncProgress(0);
    }
  };

  /**
   * Kích hoạt đồng bộ một bộ thẻ cụ thể từ nút trên thẻ
   */
  const handleSyncDeck = async (deck: AnkiDeck) => {
    if (syncingDeckId) return;

    // 1. Kiểm tra xác thực Google Drive
    let token = driveToken;
    if (!token) {
      try {
        token = await requestDriveAccess();
        await refreshDriveList(token);
      } catch (err: any) {
        alert('Cần cấp quyền truy cập Google Drive để sao lưu: ' + (err?.message || ''));
        return;
      }
    }

    // 2. Kiểm tra xem đã có tệp gốc .apkg trong IndexedDB chưa
    const cachedBlob = await indexedDbService.getDeckApkgBlob(deck.id);

    if (!cachedBlob) {
      // Bộ thẻ được nhập trước khi có tính năng cache -> Mở file picker 1 lần duy nhất
      setLegacyDeckTarget(deck);
      legacyFileInputRef.current?.click();
      return;
    }

    // 3. Đã có blob trong máy -> Đồng bộ 1 chạm trực tiếp
    const filename = deck.rawFileName || `${deck.title}.apkg`;
    await uploadDeckToDrive(deck, cachedBlob, filename, token);
  };

  /**
   * Xử lý khi người dùng chọn file .apkg cho bộ thẻ cũ chưa lưu cache
   */
  const handleLegacyFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !legacyDeckTarget) return;

    if (!file.name.toLowerCase().endsWith('.apkg')) {
      alert('Vui lòng chọn tệp định dạng .apkg');
      return;
    }

    const targetDeck = legacyDeckTarget;
    setLegacyDeckTarget(null);
    e.target.value = ''; // Reset input để có thể chọn lại nếu cần

    // Lưu tệp vào IndexedDB cho các lần sau
    await indexedDbService.saveDeckApkgBlob(targetDeck.id, file);

    let token = driveToken;
    if (!token) {
      try {
        token = await requestDriveAccess();
        await refreshDriveList(token);
      } catch (err: any) {
        alert('Cần cấp quyền Google Drive để tiếp tục: ' + (err?.message || ''));
        return;
      }
    }

    await uploadDeckToDrive(targetDeck, file, file.name, token);
  };

  /**
   * Khớp thông tin tệp Google Drive với bộ thẻ cục bộ
   */
  const findDriveItemForDeck = (deck: AnkiDeck): DriveDeckItem | undefined => {
    if (!driveItems || driveItems.length === 0) return undefined;

    return driveItems.find((item) => {
      // Khớp theo driveFileId
      if (deck.driveFileId && item.id === deck.driveFileId) return true;
      // Khớp theo tên file gốc
      if (deck.rawFileName && item.name.toLowerCase() === deck.rawFileName.toLowerCase()) return true;
      if (deck.driveFileName && item.name.toLowerCase() === deck.driveFileName.toLowerCase()) return true;
      // Khớp theo tiêu đề deck + .apkg
      const normDeckTitle = deck.title.toLowerCase().trim();
      const normItemTitle = item.name.toLowerCase().replace(/\.apkg$/i, '').trim();
      return normDeckTitle === normItemTitle || item.name.toLowerCase() === `${normDeckTitle}.apkg`;
    });
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
      {/* Hidden file input cho bộ thẻ cũ */}
      <input
        ref={legacyFileInputRef}
        type="file"
        accept=".apkg"
        onChange={handleLegacyFileSelected}
        className="hidden"
      />

      {selectedLexiconDeckId ? (
        /* Màn hình Kho Tri Thức & Danh Sách Từ Vựng Chuyên Biệt */
        <DeckLexiconView
          deckId={selectedLexiconDeckId}
          onBack={() => {
            setSelectedLexiconDeckId(null);
            loadDecks();
          }}
          onOpenDashboard={() => {
            setSelectedDashboardDeckId(selectedLexiconDeckId);
            setSelectedLexiconDeckId(null);
          }}
          onStartReview={(deckId, targetCardIds, customSubtitle) => {
            setReviewTargetCardIds(targetCardIds);
            setReviewCustomSubtitle(customSubtitle);
            setActiveReviewDeckId(deckId);
          }}
        />
      ) : selectedDashboardDeckId ? (
        /* Màn hình Dashboard chi tiết bộ thẻ */
        <DeckDashboardView
          key={`${selectedDashboardDeckId}_${dashboardRefreshKey}`}
          deckId={selectedDashboardDeckId}
          refreshKey={dashboardRefreshKey}
          onBack={() => {
            setSelectedDashboardDeckId(null);
            loadDecks();
          }}
          onOpenLexicon={() => {
            setSelectedLexiconDeckId(selectedDashboardDeckId);
            setSelectedDashboardDeckId(null);
          }}
          onStartReview={(deckId, targetCardIds, customSubtitle) => {
            setReviewTargetCardIds(targetCardIds);
            setReviewCustomSubtitle(customSubtitle);
            setActiveReviewDeckId(deckId);
          }}
        />
      ) : (
        <>
          {/* Header Tab - Thiết kế Responsive thích ứng hoàn hảo với màn hình iPhone */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-subtle min-w-0">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-bold text-text-primary tracking-tight">
            Góc Ôn Tập Vi Mô
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Xây dựng tri thức bền vững với các phiên học 2 phút mỗi ngày
          </p>
        </div>

        {/* Thanh công cụ hành động: Drive, Giải Mã Deck, Nhập Bộ Thẻ */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-0.5 sm:pt-0">
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-2xs shrink-0"
            title="Quản lý sao lưu và khôi phục từ Google Drive"
          >
            <Cloud className={cn('w-3.5 h-3.5 shrink-0', driveToken ? 'text-accent-sage' : 'text-text-tertiary')} />
            <span className="hidden sm:inline">Google Drive</span>
            <span className="sm:hidden">Drive</span>
            {driveItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-accent-sprout text-primary font-mono text-[10px] font-bold">
                {driveItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('anki-decoder')}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shrink-0 ml-auto sm:ml-0"
            title="Nhập bộ thẻ .apkg qua Studio Inspector"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Nhập Bộ Thẻ (.apkg)</span>
            <span className="sm:hidden">Nhập Thẻ</span>
          </button>
        </div>
      </div>

      {/* Danh sách Bộ Thẻ hoặc Clean Empty State */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-tertiary">
          Đang nạp dữ liệu bộ thẻ...
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 sm:p-10 text-center space-y-3 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-sprout text-primary mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Chưa có bộ thẻ Flashcard nào
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
              Bạn có thể nhập trực tiếp các tệp <span className="font-mono font-semibold text-primary">.apkg</span> từ Anki (từ vựng, thuật ngữ, động từ bất quy tắc) để ôn tập 2 phút mỗi ngày.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('anki-decoder')}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nhập bộ thẻ Anki (.apkg)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => {
            const matchedDrive = findDriveItemForDeck(deck);
            const isThisDeckSyncing = syncingDeckId === deck.id;

            return (
              <div
                key={deck.id}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between min-w-0"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div
                      onClick={() => setSelectedDashboardDeckId(deck.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                      title="Bấm để mở Dashboard thống kê và quản lý bộ thẻ"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <h3 className="font-serif text-base font-bold text-text-primary truncate group-hover:text-primary transition-colors" title={deck.title}>
                        {deck.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeck(deck.id, deck.title)}
                      className="p-1 text-text-tertiary hover:text-accent-clay hover:bg-accent-clay/10 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
                      title="Xóa bộ thẻ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    onClick={() => setSelectedDashboardDeckId(deck.id)}
                    className="flex items-center gap-2 sm:gap-3 text-xs font-mono text-text-tertiary pt-0.5 flex-wrap cursor-pointer"
                  >
                    <span className="shrink-0">
                      Quy mô: <strong className="text-text-primary">{deck.cardCount} thẻ</strong>
                    </span>
                    <span className="shrink-0">•</span>
                    <span className="flex items-center gap-1 text-accent-sage font-medium shrink-0">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Quy tắc 2 phút</span>
                    </span>
                  </div>
                </div>

                {/* Khu vực Trạng Thái Đồng Bộ Google Drive */}
                <div className="space-y-3 pt-0.5 min-w-0">
                  <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs min-w-0">
                    {isThisDeckSyncing ? (
                      /* Đang đồng bộ */
                      <div className="flex items-center gap-2 text-primary font-medium w-full py-1 min-w-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-primary" />
                        <span className="text-[11px] truncate">
                          Đang sao lưu lên Drive... ({syncProgress}%)
                        </span>
                      </div>
                    ) : matchedDrive ? (
                      /* Đã đồng bộ lên Drive */
                      <div className="flex items-center justify-between w-full min-w-0 gap-2">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-sprout/70 text-primary text-[11px] font-medium border border-accent-sage/20 min-w-0 truncate"
                          title={`Đã sao lưu an toàn: ${matchedDrive.name} (${(matchedDrive.size / 1024 / 1024).toFixed(1)} MB)`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-sage shrink-0" />
                          <span className="truncate">Đã đồng bộ Drive</span>
                        </div>

                        <button
                          type="button"
                          disabled={!!syncingDeckId}
                          onClick={() => handleSyncDeck(deck)}
                          className="p-1 rounded-md text-text-tertiary hover:text-primary hover:bg-canvas transition-colors cursor-pointer shrink-0"
                          title="Đồng bộ lại phiên bản mới lên Google Drive"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : !driveToken ? (
                      /* Chưa kết nối Google Drive */
                      <button
                        type="button"
                        onClick={() => handleSyncDeck(deck)}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-dashed border-border bg-canvas hover:border-primary/50 hover:text-primary text-[11px] font-medium text-text-secondary transition-all cursor-pointer min-w-0"
                        title="Bấm để kết nối Google Drive và sao lưu bộ thẻ này"
                      >
                        <Cloud className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                        <span className="truncate">Kết nối Drive để sao lưu</span>
                      </button>
                    ) : (
                      /* Đã kết nối Drive nhưng bộ thẻ này chưa đồng bộ */
                      <button
                        type="button"
                        disabled={!!syncingDeckId}
                        onClick={() => handleSyncDeck(deck)}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-border bg-canvas hover:bg-accent-sprout/40 hover:border-accent-sage/40 hover:text-primary text-[11px] font-medium text-text-secondary transition-all cursor-pointer shadow-2xs min-w-0"
                        title="Bấm để sao lưu bộ thẻ này lên Google Drive"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-accent-sage shrink-0" />
                        <span className="truncate">Đồng bộ lên Drive</span>
                      </button>
                    )}
                  </div>

                  {/* Cụm 3 nút hành động: Danh sách, Thống kê & Ôn 2 phút */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLexiconDeckId(deck.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-canvas border border-border py-2 px-1.5 sm:px-2 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface hover:border-primary/40 active:scale-98 transition-all cursor-pointer shadow-2xs min-w-0"
                      title="Xem danh sách từ vựng và chủ đề bài học"
                    >
                      <List className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Danh sách</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDashboardDeckId(deck.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-canvas border border-border py-2 px-1.5 sm:px-2 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface hover:border-primary/40 active:scale-98 transition-all cursor-pointer shadow-2xs min-w-0"
                      title="Mở bảng điều khiển, dự báo và sức sống bộ thẻ"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-accent-sage shrink-0" />
                      <span className="truncate">Thống kê</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReviewTargetCardIds(undefined);
                        setReviewCustomSubtitle(undefined);
                        setActiveReviewDeckId(deck.id);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-2 px-1.5 sm:px-2 text-xs font-semibold text-white hover:bg-primary-hover active:scale-98 transition-all cursor-pointer shadow-xs min-w-0"
                      title="Bắt đầu phiên ôn 2 phút ngay"
                    >
                      <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span className="truncate">Ôn 2p</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
    )}

      {/* Trình Lật Thẻ Zen */}
      {activeReviewDeckId && (
        <ZenFlashcardViewer
          deckId={activeReviewDeckId}
          isOpen={!!activeReviewDeckId}
          targetCardIds={reviewTargetCardIds}
          customSubtitle={reviewCustomSubtitle}
          onClose={() => {
            setActiveReviewDeckId(null);
            setReviewTargetCardIds(undefined);
            setReviewCustomSubtitle(undefined);
            setDashboardRefreshKey((k) => k + 1);
            loadDecks();
          }}
          onCompleteSession={() => {
            const completedId = activeReviewDeckId;
            setDashboardRefreshKey((k) => k + 1);
            loadDecks();
            if (completedId) {
              onSessionCompleted?.(completedId);
            }
          }}
        />
      )}

      {/* Modal Duyệt Danh Sách Từ Vựng Của Bộ Thẻ */}
      {activeWordsDeckId && (
        <DeckWordsModal
          deckId={activeWordsDeckId}
          isOpen={!!activeWordsDeckId}
          onClose={() => setActiveWordsDeckId(null)}
          onStartReview={(deckId, targetCardIds, customSubtitle) => {
            setActiveWordsDeckId(null);
            setReviewTargetCardIds(targetCardIds);
            setReviewCustomSubtitle(customSubtitle);
            setActiveReviewDeckId(deckId);
          }}
        />
      )}

      {/* Modal Quản Lý & Khôi Phục Google Drive */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onDeckRestored={(deckId) => {
          loadDecks();
          if (driveToken) refreshDriveList(driveToken);
          setActiveReviewDeckId(deckId);
        }}
      />
    </div>
  );
};
