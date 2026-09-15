import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { googleDriveService, DriveDeckItem } from '../../services/googleDriveService';
import { parseAnkiPackage } from '../../services/ankiParser';
import { indexedDbService } from '../../services/indexedDbService';
import { AnkiDeck } from '../../types/anki';
import {
  Cloud,
  FolderSync,
  X,
  Download,
  Trash2,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  BookOpen
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckRestored: (deckId: string) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  onDeckRestored
}) => {
  const { user, driveToken, requestDriveAccess } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [decksOnDrive, setDecksOnDrive] = useState<DriveDeckItem[]>([]);
  const [localDecks, setLocalDecks] = useState<AnkiDeck[]>([]);
  const [legacyDeckTarget, setLegacyDeckTarget] = useState<AnkiDeck | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tải danh sách bộ thẻ trên thiết bị
  const loadLocalDecks = useCallback(async () => {
    try {
      const fetched = await indexedDbService.getAllDecks();
      setLocalDecks(fetched);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách bộ thẻ cục bộ:', err);
    }
  }, []);

  // Tải danh sách các file sao lưu trên Google Drive
  const loadDriveList = useCallback(async (token: string) => {
    setIsLoadingList(true);
    setErrorMessage(null);
    try {
      const items = await googleDriveService.listDecksOnDrive(token);
      setDecksOnDrive(items);
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách tệp Google Drive:', err);
      // Nếu token hết hạn (401), yêu cầu đăng nhập lại
      if (err?.message?.includes('401')) {
        setErrorMessage('Phiên kết nối Google Drive đã hết hạn. Vui lòng bấm Kết nối lại.');
      } else {
        setErrorMessage(err?.message || 'Không thể tải danh sách tệp từ Google Drive.');
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLocalDecks();
      if (driveToken) {
        loadDriveList(driveToken);
      }
    }
  }, [isOpen, driveToken, loadDriveList, loadLocalDecks]);

  // Kết nối xin quyền Google Drive
  const handleConnectDrive = async () => {
    setErrorMessage(null);
    setActionLoading(true);
    try {
      const token = await requestDriveAccess();
      await loadDriveList(token);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể kết nối với Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  // Khôi phục bộ thẻ từ Drive về thiết bị hiện tại
  const handleRestoreDeck = async (item: DriveDeckItem) => {
    if (!driveToken) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressPercent(0);
    setProgressMessage(`Đang chuẩn bị tải "${item.name}"...`);

    try {
      // 1. Tải Blob từ Google Drive
      const blob = await googleDriveService.downloadDeckFile(
        driveToken,
        item.id,
        (percent, message) => {
          setProgressPercent(percent);
          setProgressMessage(message);
        }
      );

      // 2. Chuyển Blob thành File để parse
      const file = new File([blob], item.name, { type: 'application/octet-stream' });
      setProgressMessage('Đang giải nén và lưu vào máy...');

      const result = await parseAnkiPackage(file, (percent, message) => {
        setProgressPercent(percent);
        setProgressMessage(message);
      });

      // 3. Lưu vào IndexedDB của máy này
      await indexedDbService.saveDeck(result.deck);
      await indexedDbService.saveCardsBatch(result.cards);
      if (result.mediaItems.length > 0) {
        await indexedDbService.saveMediaItemsBatch(result.mediaItems);
      }

      setSuccessMessage(`Đã khôi phục thành công bộ thẻ "${result.deck.title}" về máy của bạn!`);
      onDeckRestored(result.deck.id);
    } catch (err: any) {
      console.error('Lỗi khi khôi phục từ Drive:', err);
      setErrorMessage(err?.message || 'Lỗi trong quá trình khôi phục tệp.');
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa tệp sao lưu khỏi Google Drive
  const handleDeleteDeckFromDrive = async (item: DriveDeckItem) => {
    if (!driveToken) return;

    const sizeMb = (item.size / 1024 / 1024).toFixed(1);
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bản sao lưu "${item.name}" (${sizeMb} MB) khỏi Google Drive?\n\nHành động này sẽ giải phóng dung lượng trên Drive của bạn.`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressMessage(`Đang xóa "${item.name}" khỏi Google Drive...`);

    try {
      await googleDriveService.deleteDeckFile(driveToken, item.id);
      setSuccessMessage(`Đã xóa thành công "${item.name}" khỏi Google Drive.`);
      await loadDriveList(driveToken);
    } catch (err: any) {
      console.error('Lỗi khi xóa file trên Drive:', err);
      setErrorMessage(err?.message || 'Không thể xóa tệp trên Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  // Tải file .apkg mới từ máy lên Drive
  const handleUploadNewFile = async (file: File) => {
    if (!driveToken) return;
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setErrorMessage('Vui lòng chọn tệp có định dạng .apkg');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressPercent(0);

    try {
      await googleDriveService.uploadDeckFile(driveToken, file, file.name, (percent, message) => {
        setProgressPercent(percent);
        setProgressMessage(message);
      });

      setSuccessMessage(`Đã sao lưu thành công "${file.name}" lên thư mục Atomic Growth/Anki Decks trên Google Drive!`);
      await loadDriveList(driveToken);
      await loadLocalDecks();
    } catch (err: any) {
      console.error('Lỗi khi sao lưu lên Drive:', err);
      setErrorMessage(err?.message || 'Không thể tải tệp lên Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  // Sao lưu một bộ thẻ đã có sẵn trên máy lên Google Drive
  const handleBackupLocalDeck = async (deck: AnkiDeck) => {
    if (!driveToken) return;

    // Kiểm tra xem đã có tệp gốc .apkg trong IndexedDB chưa
    const cachedBlob = await indexedDbService.getDeckApkgBlob(deck.id);
    if (!cachedBlob) {
      // Bộ thẻ cũ chưa có blob -> mở file picker để chọn 1 lần duy nhất
      setLegacyDeckTarget(deck);
      fileInputRef.current?.click();
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressPercent(0);
    setProgressMessage(`Đang chuẩn bị sao lưu "${deck.title}"...`);

    try {
      const filename = deck.rawFileName || `${deck.title}.apkg`;
      const fileId = await googleDriveService.uploadDeckFile(
        driveToken,
        cachedBlob,
        filename,
        (percent, message) => {
          setProgressPercent(percent);
          setProgressMessage(message);
        }
      );

      // Cập nhật metadata của deck trong IndexedDB
      const updatedDeck: AnkiDeck = {
        ...deck,
        driveFileId: fileId,
        driveFileName: filename,
        driveSyncedAt: new Date().toISOString()
      };
      await indexedDbService.saveDeck(updatedDeck);
      setSuccessMessage(`Đã sao lưu thành công "${deck.title}" lên Google Drive!`);
      await loadLocalDecks();
      await loadDriveList(driveToken);
    } catch (err: any) {
      console.error('Lỗi khi sao lưu bộ thẻ cục bộ lên Drive:', err);
      setErrorMessage(err?.message || 'Không thể sao lưu bộ thẻ lên Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-sage/20 text-primary shadow-2xs">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-text-primary">
                Đồng Bộ Google Drive Cá Nhân
              </h2>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <span>Lưu trữ tại:</span>
                <span className="font-mono text-primary font-semibold">Atomic Growth/Anki Decks/</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-accent-clay/30 bg-accent-clay/10 p-3.5 text-xs text-accent-clay animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-accent-sage/30 bg-accent-sprout/30 p-3.5 text-xs text-primary animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Trạng thái 1: Chưa kết nối Drive Token */}
        {!driveToken ? (
          <div className="rounded-xl border border-dashed border-border bg-canvas p-6 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-sage/10 text-primary mx-auto">
              <FolderSync className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-text-primary">
                Kết Nối Với Google Drive
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Ứng dụng chỉ xin quyền tạo thư mục <strong className="text-text-primary">"Atomic Growth"</strong> để lưu trữ các bộ thẻ của bạn. Dữ liệu cá nhân khác trên Drive hoàn toàn an toàn và riêng tư 100%.
              </p>
            </div>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleConnectDrive}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              <span>Kết Nối Google Drive</span>
            </button>
          </div>
        ) : (
          /* Trạng thái 2: Đã kết nối Drive */
          <div className="space-y-5">
            {/* Thanh thông tin tài khoản kết nối */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-canvas px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-accent-sage" />
                <span>
                  Đã kết nối Drive: <strong className="text-text-primary">{user?.email || 'Tài khoản Google'}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => loadDriveList(driveToken)}
                disabled={isLoadingList || actionLoading}
                className="p-1 rounded-md text-text-tertiary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isLoadingList && 'animate-spin')} />
              </button>
            </div>

            {/* Đang có tác vụ tải lên / tải về */}
            {actionLoading && (
              <div className="rounded-xl border border-primary/20 bg-accent-sprout/20 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressMessage || 'Đang xử lý dữ liệu...'}</span>
                </div>
                <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="font-mono text-[11px] text-text-tertiary text-right">{progressPercent}%</p>
              </div>
            )}

            {/* Danh sách các bộ thẻ trên thiết bị này */}
            {localDecks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Bộ thẻ trên máy ({localDecks.length})</span>
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {localDecks.map((deck) => {
                    const isSynced = decksOnDrive.some((d) => {
                      if (deck.driveFileId && d.id === deck.driveFileId) return true;
                      if (deck.rawFileName && d.name.toLowerCase() === deck.rawFileName.toLowerCase()) return true;
                      if (deck.driveFileName && d.name.toLowerCase() === deck.driveFileName.toLowerCase()) return true;
                      const normDeckTitle = deck.title.toLowerCase().trim();
                      const normDriveTitle = d.name.toLowerCase().replace(/\.apkg$/i, '').trim();
                      return normDeckTitle === normDriveTitle || d.name.toLowerCase() === `${normDeckTitle}.apkg`;
                    });

                    return (
                      <div
                        key={deck.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-canvas p-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-text-primary truncate" title={deck.title}>
                            {deck.title}
                          </h4>
                          <div className="text-[11px] font-mono text-text-tertiary mt-0.5">
                            <span>{deck.cardCount} thẻ</span>
                            {deck.driveSyncedAt && (
                              <span> • Đã đồng bộ {new Date(deck.driveSyncedAt).toLocaleDateString('vi-VN')}</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSynced ? (
                            <span className="inline-flex items-center gap-1 text-accent-sage font-medium text-[11px] bg-accent-sprout/70 px-2.5 py-1 rounded-full border border-accent-sage/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã lưu Drive</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleBackupLocalDeck(deck)}
                              className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-2.5 py-1.5 font-semibold text-primary hover:bg-accent-sprout/60 transition-colors cursor-pointer shadow-2xs text-[11px]"
                              title="Sao lưu bộ thẻ này lên Google Drive"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-accent-sage" />
                              <span>Sao lưu lên Drive</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Danh sách các bộ thẻ trên Google Drive */}
            <div className="space-y-2.5 pt-2 border-t border-border-subtle">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Các bộ thẻ trên Google Drive ({decksOnDrive.length})</span>
                </span>
              </div>

              {isLoadingList ? (
                <div className="text-center py-6 text-xs text-text-tertiary">
                  Đang kiểm tra thư mục Atomic Growth/Anki Decks...
                </div>
              ) : decksOnDrive.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-canvas p-6 text-center text-xs text-text-tertiary">
                  Chưa có bộ thẻ nào được sao lưu trong thư mục <strong className="text-text-primary">Atomic Growth/Anki Decks/</strong> trên Drive của bạn.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {decksOnDrive.map((item) => {
                    const sizeMb = (item.size / 1024 / 1024).toFixed(1);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-canvas p-3 hover:border-primary/40 transition-all text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-text-primary truncate" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-text-tertiary mt-0.5">
                            <span>{sizeMb} MB</span>
                            <span>•</span>
                            <span>{new Date(item.modifiedTime).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Nút Tải Về Máy */}
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleRestoreDeck(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-2.5 py-1.5 font-semibold text-primary hover:bg-accent-sprout/60 transition-colors cursor-pointer shadow-2xs"
                            title="Tải bộ thẻ này về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tải về</span>
                          </button>

                          {/* Nút Xóa Khỏi Drive */}
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDeleteDeckFromDrive(item)}
                            className="rounded-lg p-1.5 text-text-tertiary hover:text-accent-clay hover:bg-accent-clay/10 transition-colors cursor-pointer"
                            title="Xóa vĩnh viễn tệp này khỏi Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Khu vực tải thêm tệp mới lên Drive */}
            <div className="pt-2 border-t border-border-subtle">
              <input
                ref={fileInputRef}
                type="file"
                accept=".apkg"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (legacyDeckTarget) {
                      // Lưu vào IndexedDB cho bộ thẻ đang cần cache
                      await indexedDbService.saveDeckApkgBlob(legacyDeckTarget.id, file);
                      legacyDeckTarget.rawFileName = file.name;
                      await indexedDbService.saveDeck(legacyDeckTarget);
                      setLegacyDeckTarget(null);
                    }
                    await handleUploadNewFile(file);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-canvas border border-dashed border-border py-2.5 text-xs font-semibold text-text-secondary hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Sao lưu thêm file .apkg lên Google Drive</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
