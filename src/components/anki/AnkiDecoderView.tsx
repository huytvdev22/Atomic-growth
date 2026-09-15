import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  AnkiInspectionReport,
  AnkiCard,
  AnkiFieldMappingConfig
} from '../../types/anki';
import { AnkiDecoderService } from '../../services/ankiDecoderService';
import { useHabits } from '../../context/HabitContext';
import { cn } from '../../utils/cn';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Layers,
  Sparkles,
  Volume2,
  Image as ImageIcon,
  Download,
  RotateCcw,
  Search,
  Database,
  Sliders,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Loader2,
  Check
} from 'lucide-react';

interface AnkiDecoderViewProps {
  onImportCompleted?: (deckId: string) => void;
}

type DecoderTab = 'overview' | 'decks' | 'mapping' | 'explorer' | 'preview';

export const AnkiDecoderView: React.FC<AnkiDecoderViewProps> = ({ onImportCompleted }) => {
  const { setActiveTab } = useHabits();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái tệp và xử lý
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [report, setReport] = useState<AnkiInspectionReport | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Tab con trong Decoder
  const [activeSubTab, setActiveSubTab] = useState<DecoderTab>('overview');

  // Lọc theo Subdeck cụ thể (null = toàn bộ)
  const [selectedSubdeckId, setSelectedSubdeckId] = useState<string | null>(null);

  // Cấu hình mapping trường theo từng modelId
  const [fieldMappings, setFieldMappings] = useState<Record<string, AnkiFieldMappingConfig>>({});

  // Tìm kiếm trong Raw Notes Explorer
  const [explorerSearch, setExplorerSearch] = useState('');

  // Live Card Preview
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [previewAudioBlobUrl, setPreviewAudioBlobUrl] = useState<string | null>(null);
  const [previewImageBlobUrl, setPreviewImageBlobUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);

  // Trạng thái Lưu vào ứng dụng
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessDeckId, setSaveSuccessDeckId] = useState<string | null>(null);

  // Tải cấu hình mapping mặc định khi có báo cáo mới
  useEffect(() => {
    if (report && report.defaultMapping) {
      setFieldMappings(JSON.parse(JSON.stringify(report.defaultMapping)));
      setSelectedSubdeckId(null);
      setPreviewCardIndex(0);
    }
  }, [report]);

  // Xử lý nạp file .apkg
  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setGeneralError('Vui lòng chọn tệp định dạng .apkg xuất từ Anki.');
      return;
    }

    setGeneralError(null);
    setSelectedFile(file);
    setIsInspecting(true);
    setProgressPercent(0);
    setProgressMessage('Đang khởi tạo bóc tách gói Anki...');
    setSaveSuccessDeckId(null);

    try {
      const inspection = await AnkiDecoderService.inspectPackage(file, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMessage(msg);
      });
      setReport(inspection);
      setActiveSubTab('overview');
    } catch (err: any) {
      console.error('Lỗi khi kiểm tra gói Anki:', err);
      setGeneralError(err?.message || 'Có lỗi xảy ra khi bóc tách tệp Anki.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Tính toán danh sách cards được sinh ra theo cấu hình hiện tại
  const generatedCards: AnkiCard[] = useMemo(() => {
    if (!report || report.rawNotes.length === 0) return [];
    return AnkiDecoderService.generateMappedCards(
      report,
      fieldMappings,
      selectedSubdeckId || undefined
    );
  }, [report, fieldMappings, selectedSubdeckId]);

  // Thẻ đang được xem trước trong tab Preview
  const currentPreviewCard = useMemo(() => {
    if (generatedCards.length === 0) return null;
    const safeIndex = Math.min(Math.max(0, previewCardIndex), generatedCards.length - 1);
    return generatedCards[safeIndex];
  }, [generatedCards, previewCardIndex]);

  // Nạp media blob cho thẻ xem trước
  useEffect(() => {
    let active = true;
    setPreviewAudioBlobUrl(null);
    setPreviewImageBlobUrl(null);
    setPreviewFlipped(false);

    if (!selectedFile || !currentPreviewCard || !report) return;

    // Trích xuất Audio xem trước
    if (currentPreviewCard.audioName) {
      AnkiDecoderService.extractMediaBlob(
        selectedFile,
        currentPreviewCard.audioName,
        report.mediaMap
      ).then((blob) => {
        if (active && blob) {
          setPreviewAudioBlobUrl(URL.createObjectURL(blob));
        }
      });
    }

    // Trích xuất Image xem trước
    if (currentPreviewCard.imageName) {
      AnkiDecoderService.extractMediaBlob(
        selectedFile,
        currentPreviewCard.imageName,
        report.mediaMap
      ).then((blob) => {
        if (active && blob) {
          setPreviewImageBlobUrl(URL.createObjectURL(blob));
        }
      });
    }

    return () => {
      active = false;
    };
  }, [currentPreviewCard, selectedFile, report]);

  // Cập nhật cấu hình Mapping cho 1 model (Hỗ trợ đa trường cho Mặt trước)
  const toggleModelFrontField = (modelId: string, fieldIdx: number) => {
    setFieldMappings((prev) => {
      const current = prev[modelId] || {
        modelId,
        frontFieldIndex: 0,
        frontFieldIndices: [0],
        backFieldIndices: [1]
      };
      const currentFronts =
        current.frontFieldIndices && current.frontFieldIndices.length > 0
          ? current.frontFieldIndices
          : current.frontFieldIndex !== undefined
          ? [current.frontFieldIndex]
          : [0];

      const exists = currentFronts.includes(fieldIdx);
      let newFronts: number[];

      if (exists) {
        // Giữ ít nhất 1 trường cho mặt trước
        if (currentFronts.length <= 1) return prev;
        newFronts = currentFronts.filter((i) => i !== fieldIdx);
      } else {
        newFronts = [...currentFronts, fieldIdx];
      }

      // Tự động bỏ chọn trường này ở mặt sau nếu có để tránh trùng lặp
      const newBack = current.backFieldIndices.filter((b) => !newFronts.includes(b));

      return {
        ...prev,
        [modelId]: {
          ...current,
          frontFieldIndex: newFronts[0],
          frontFieldIndices: newFronts,
          backFieldIndices: newBack.length > 0 ? newBack : current.backFieldIndices
        }
      };
    });
  };

  const toggleModelBackField = (modelId: string, fieldIdx: number) => {
    setFieldMappings((prev) => {
      const current = prev[modelId] || {
        modelId,
        frontFieldIndex: 0,
        frontFieldIndices: [0],
        backFieldIndices: [1]
      };
      const currentFronts =
        current.frontFieldIndices && current.frontFieldIndices.length > 0
          ? current.frontFieldIndices
          : [current.frontFieldIndex ?? 0];

      // Nếu trường này đang nằm ở mặt trước thì không cho chọn ở mặt sau
      if (currentFronts.includes(fieldIdx)) return prev;

      const exists = current.backFieldIndices.includes(fieldIdx);
      const newBack = exists
        ? current.backFieldIndices.filter((i) => i !== fieldIdx)
        : [...current.backFieldIndices, fieldIdx].sort((a, b) => a - b);

      return {
        ...prev,
        [modelId]: {
          ...current,
          backFieldIndices: newBack.length > 0 ? newBack : [fieldIdx]
        }
      };
    });
  };

  const updateModelAudioField = (modelId: string, audioIdx: number | undefined) => {
    setFieldMappings((prev) => ({
      ...prev,
      [modelId]: {
        ...(prev[modelId] || {
          modelId,
          frontFieldIndex: 0,
          backFieldIndices: [1]
        }),
        audioFieldIndex: audioIdx
      }
    }));
  };

  const updateModelImageField = (modelId: string, imageIdx: number | undefined) => {
    setFieldMappings((prev) => ({
      ...prev,
      [modelId]: {
        ...(prev[modelId] || {
          modelId,
          frontFieldIndex: 0,
          backFieldIndices: [1]
        }),
        imageFieldIndex: imageIdx
      }
    }));
  };

  // Phát âm thanh
  const handlePlayAudio = () => {
    if (!previewAudioBlobUrl || isPlayingAudio) return;
    setIsPlayingAudio(true);
    const audio = new Audio(previewAudioBlobUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  // Xuất file JSON chẩn đoán
  const handleExportJson = () => {
    if (!report) return;
    const exportData = {
      meta: {
        fileName: report.fileName,
        fileSizeBytes: report.fileSizeBytes,
        dbType: report.dbType,
        totalNotes: report.totalNotes,
        totalCards: report.totalCards,
        mediaCount: report.mediaCount,
        exportedAt: new Date().toISOString()
      },
      issues: report.issues,
      decks: report.decks,
      models: report.models,
      mappings: fieldMappings,
      sampleCards: generatedCards.slice(0, 100)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki_diagnostic_${report.fileName.replace(/\.apkg$/i, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lưu và nhập vào ứng dụng
  const handleSaveToApp = async () => {
    if (!report || !selectedFile || generatedCards.length === 0) return;

    setIsSaving(true);
    setProgressPercent(0);
    setProgressMessage('Đang chuẩn bị lưu vào thư viện...');

    try {
      // Tên bộ thẻ
      let deckTitle = report.fileName.replace(/\.apkg$/i, '').replace(/_/g, ' ');
      if (selectedSubdeckId) {
        const targetSubdeck = report.decks.find((d) => d.id === selectedSubdeckId);
        if (targetSubdeck) {
          deckTitle = targetSubdeck.name.replace(/::/g, ' - ');
        }
      }

      const savedDeckId = await AnkiDecoderService.saveConfiguredDeckToApp(
        deckTitle,
        generatedCards,
        selectedFile,
        report.mediaMap,
        (percent, msg) => {
          setProgressPercent(percent);
          setProgressMessage(msg);
        }
      );

      setSaveSuccessDeckId(savedDeckId);
      onImportCompleted?.(savedDeckId);
    } catch (err: any) {
      console.error('Lỗi khi lưu bộ thẻ vào máy:', err);
      alert('Không thể lưu bộ thẻ: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc notes trong Explorer
  const filteredRawNotes = useMemo(() => {
    if (!report) return [];
    if (!explorerSearch.trim()) return report.rawNotes.slice(0, 50);

    const q = explorerSearch.toLowerCase();
    return report.rawNotes
      .filter(
        (n) =>
          n.fields.some((f) => f.toLowerCase().includes(q)) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.id.includes(q)
      )
      .slice(0, 50);
  }, [report, explorerSearch]);

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề Phong cách Zen Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-sage/20 text-primary px-2.5 py-0.5 text-[11px] font-semibold font-mono">
              <FileCode className="w-3 h-3" />
              <span>Studio Inspector</span>
            </span>
            <span className="text-xs text-text-tertiary">•</span>
            <span className="text-xs text-text-secondary">WebAssembly SQLite Engine</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary mt-1">
            Giải Mã & Chẩn Đoán Bộ Thẻ Anki
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Phân tích cấu trúc tệp .apkg, bóc tách các trường dữ liệu tùy biến và kiểm tra trước khi nhập.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-canvas-subtle transition-all cursor-pointer"
              title="Xuất toàn bộ cấu trúc và báo cáo ra file JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setReport(null);
                setSelectedFile(null);
                setSaveSuccessDeckId(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-canvas-subtle transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đổi Tệp</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Vùng Kéo Thả / Chọn Tệp (Chỉ hiện khi chưa nạp file hoặc đang nạp) */}
      {!report && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".apkg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isInspecting && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3',
              isDragging
                ? 'border-primary bg-accent-sprout/20 scale-[0.99]'
                : 'border-border bg-surface hover:border-primary/50 hover:bg-canvas-subtle/50'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent-sprout/60 text-primary flex items-center justify-center shadow-2xs">
              {isInspecting ? (
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              ) : (
                <UploadCloud className="w-7 h-7 stroke-[1.75]" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary">
                {isInspecting
                  ? 'Đang tiến hành giải mã gói thẻ...'
                  : 'Kéo thả tệp .apkg vào đây hoặc nhấn để duyệt tệp'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Tương thích cả gói Anki 2.0, Anki 2.1 và các bộ thẻ có nhiều trường âm thanh/hình ảnh.
              </p>
            </div>

            {/* Thanh tiến trình khi đang bóc tách */}
            {isInspecting && (
              <div className="w-full max-w-md space-y-2 mt-2">
                <div className="h-2 w-full rounded-full bg-canvas-subtle overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
                  <span>{progressMessage}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            )}
          </div>

          {generalError && (
            <div className="p-4 rounded-xl bg-accent-clay/10 border border-accent-clay/30 text-accent-clay text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Không thể bóc tách gói Anki</p>
                <p className="text-text-secondary">{generalError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Khu Vực Báo Cáo & Chẩn Đoán Chi Tiết Khi Đã Bóc Tách Thành Công */}
      {report && (
        <div className="space-y-6">
          {/* Thanh thông tin nhanh về tệp */}
          <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent-sprout/50 text-primary flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-text-primary truncate" title={report.fileName}>
                  {report.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                  <span className="font-mono">{(report.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span
                    className={cn(
                      'font-mono px-1.5 py-0.2 rounded-xs text-[10px] font-semibold uppercase',
                      report.dbType === 'anki21' && 'bg-accent-sage/20 text-primary',
                      report.dbType === 'anki2' && 'bg-accent-amber/20 text-accent-amber',
                      report.dbType === 'anki21b_zstd' && 'bg-accent-clay/20 text-accent-clay'
                    )}
                  >
                    SQLite {report.dbType}
                  </span>
                </div>
              </div>
            </div>

            {/* Bộ đếm tổng quan */}
            <div className="flex items-center gap-4 text-center">
              <div>
                <span className="font-mono text-base font-bold text-text-primary block">
                  {report.totalNotes}
                </span>
                <span className="text-[10px] text-text-tertiary">Notes</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="font-mono text-base font-bold text-primary block">
                  {generatedCards.length}
                </span>
                <span className="text-[10px] text-text-tertiary">Cards</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="font-mono text-base font-bold text-accent-amber block">
                  {report.decks.length}
                </span>
                <span className="text-[10px] text-text-tertiary">Decks</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="font-mono text-base font-bold text-text-secondary block">
                  {report.mediaCount}
                </span>
                <span className="text-[10px] text-text-tertiary">Media</span>
              </div>
            </div>
          </div>

          {/* Thanh Tab Chẩn Đoán 5 Mục */}
          <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Tổng Quan & Chẩn Đoán', icon: Database, badge: report.issues.length },
              { id: 'decks', label: 'Cấu Trúc Decks', icon: Layers, badge: report.decks.length },
              { id: 'mapping', label: 'Mô Hình & Ghép Trường', icon: Sliders, badge: Object.keys(report.models).length },
              { id: 'explorer', label: 'Dữ Liệu Thô (Raw)', icon: Search, badge: report.totalNotes },
              { id: 'preview', label: 'Xem Trước Thẻ', icon: Eye, badge: generatedCards.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as DecoderTab)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary bg-accent-sprout/20 rounded-t-lg'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-canvas-subtle'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full font-mono text-[10px]',
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-canvas-subtle text-text-tertiary'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: TỔNG QUAN & CHẨN ĐOÁN (OVERVIEW & DIAGNOSTICS) */}
          {activeSubTab === 'overview' && (
            <div className="space-y-5">
              {/* Danh sách cảnh báo / chẩn đoán */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Báo Cáo Chẩn Đoán & Tương Thích
                </h3>
                {report.issues.map((issue) => {
                  const isError = issue.level === 'error';
                  const isWarning = issue.level === 'warning';
                  const isInfo = issue.level === 'info';

                  return (
                    <div
                      key={issue.id}
                      className={cn(
                        'p-4 rounded-xl border text-xs space-y-1.5 transition-all',
                        isError && 'bg-accent-clay/10 border-accent-clay/30 text-accent-clay',
                        isWarning && 'bg-accent-amber/10 border-accent-amber/30 text-[#8F5B12]',
                        isInfo && 'bg-surface border-border text-text-primary'
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {isError && <AlertCircle className="w-4 h-4 text-accent-clay" />}
                        {isWarning && <AlertTriangle className="w-4 h-4 text-accent-amber" />}
                        {isInfo && <Info className="w-4 h-4 text-accent-sage" />}
                        <span>{issue.title}</span>
                      </div>
                      <p className="text-text-secondary pl-6 leading-relaxed">
                        {issue.description}
                      </p>
                      {issue.solution && (
                        <div className="pl-6 pt-1">
                          <span className="inline-block bg-white/70 px-2.5 py-1 rounded-md text-[11px] font-medium text-text-primary border border-border-subtle">
                            💡 {issue.solution}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Các tệp bên trong gói ZIP */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Cấu Trúc Tệp Bên Trong Gói ZIP ({report.zipFiles.length} tệp)
                </h3>
                <div className="border border-border rounded-xl bg-surface overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-subtle text-xs">
                    {report.zipFiles.map((zf, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-canvas-subtle transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 font-mono">
                          <span className="text-text-tertiary text-[10px] w-5">#{idx + 1}</span>
                          <span
                            className={cn(
                              'truncate',
                              zf.isDatabaseFile && 'text-primary font-bold',
                              zf.isMediaMapFile && 'text-accent-amber font-bold'
                            )}
                          >
                            {zf.name}
                          </span>
                        </div>
                        <span className="font-mono text-text-tertiary text-[11px] shrink-0">
                          {(zf.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bảng SQLite Tables */}
              {report.sqliteTables.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Các Bảng Dữ Liệu SQLite Phát Hiện ({report.sqliteTables.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.sqliteTables.map((tbl) => (
                      <span
                        key={tbl}
                        className="px-2.5 py-1 rounded-md bg-canvas-subtle border border-border font-mono text-xs text-text-secondary"
                      >
                        {tbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CẤU TRÚC DECKS & SUBDECKS */}
          {activeSubTab === 'decks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Danh Sách Bộ Thẻ & Phân Nhóm Thẻ ({report.decks.length})
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Nhấp chọn một bộ thẻ để lọc xem và nhập riêng lẻ chủ đề bạn cần học.
                  </p>
                </div>
                {selectedSubdeckId && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubdeckId(null)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Xem tất cả ({report.totalCards} thẻ)
                  </button>
                )}
              </div>

              <div className="border border-border rounded-xl bg-surface divide-y divide-border-subtle overflow-hidden">
                {report.decks.map((deck) => {
                  const isSelected = selectedSubdeckId === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => setSelectedSubdeckId(isSelected ? null : deck.id)}
                      className={cn(
                        'px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-accent-sprout/30 text-primary font-semibold'
                          : 'hover:bg-canvas-subtle text-text-primary'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-border-subtle bg-canvas'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs truncate font-sans">{deck.cleanTitle}</span>
                      </div>
                      <span className="font-mono text-xs bg-canvas-subtle px-2 py-0.5 rounded-full text-text-secondary shrink-0">
                        {deck.cardCount} thẻ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MÔ HÌNH DỮ LIỆU & GHÉP TRƯỜNG (MODELS & FIELD MAPPING) */}
          {activeSubTab === 'mapping' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-accent-sage/10 border border-accent-sage/20 text-xs text-text-secondary space-y-1">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Giải Quyết Triệt Để Lỗi Hiển Thị Thẻ Lộn Xộn</span>
                </p>
                <p>
                  Tại đây bạn có thể chủ động chọn trường nào là <strong>Câu hỏi (Front)</strong>, trường nào là <strong>Lời giải (Back)</strong>, cũng như chỉ định trường chứa âm thanh phát âm hoặc hình ảnh minh họa.
                </p>
              </div>

              {Object.entries(report.models).map(([mid, model]) => {
                const mapping = fieldMappings[mid] || report.defaultMapping[mid] || {
                  modelId: mid,
                  frontFieldIndex: 0,
                  frontFieldIndices: [0],
                  backFieldIndices: [1]
                };

                const frontIndices =
                  mapping.frontFieldIndices && mapping.frontFieldIndices.length > 0
                    ? mapping.frontFieldIndices
                    : mapping.frontFieldIndex !== undefined
                    ? [mapping.frontFieldIndex]
                    : [0];

                return (
                  <div key={mid} className="p-5 rounded-xl border border-border bg-surface space-y-5">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                      <div>
                        <span className="font-mono text-[10px] text-text-tertiary">Model ID: {mid}</span>
                        <h4 className="text-sm font-bold text-text-primary font-serif">
                          {model.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const smart = report.defaultMapping[mid];
                          if (smart) {
                            setFieldMappings((prev) => ({
                              ...prev,
                              [mid]: JSON.parse(JSON.stringify(smart))
                            }));
                          }
                        }}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Tự Động Nhận Diện Lại</span>
                      </button>
                    </div>

                    {/* 1. Chọn các trường Mặt Trước (Front - Hỗ trợ chọn nhiều trường) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-primary">
                          Các Trường Hiển Thị Ở Mặt Trước (Front / Câu Hỏi / Từ Vựng):
                        </label>
                        <span className="text-[11px] font-mono text-primary font-medium">
                          Đang chọn {frontIndices.length} trường
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary">
                        Trường chọn đầu tiên hiển thị cỡ chữ lớn (Tiêu đề), các trường tiếp theo sẽ là thông tin phụ trợ bên dưới.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {model.fields.map((f) => {
                          const isFrontChecked = frontIndices.includes(f.index);
                          const frontOrder = frontIndices.indexOf(f.index);

                          return (
                            <label
                              key={f.index}
                              className={cn(
                                'px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all',
                                isFrontChecked
                                  ? 'border-primary bg-accent-sprout/30 text-primary font-semibold shadow-2xs'
                                  : 'border-border bg-canvas text-text-secondary hover:bg-canvas-subtle'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isFrontChecked}
                                  onChange={() => toggleModelFrontField(mid, f.index)}
                                  className="rounded text-primary focus:ring-0"
                                />
                                <span className="truncate">
                                  <span className="font-mono text-[10px] text-text-tertiary">[{f.index}]</span>{' '}
                                  {f.name}
                                </span>
                              </div>
                              {isFrontChecked && (
                                <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-primary text-white font-bold">
                                  {frontOrder === 0 ? 'Chính' : `#${frontOrder + 1}`}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Chọn các trường Mặt Sau (Back) */}
                    <div className="space-y-1.5 pt-3 border-t border-border-subtle">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-primary">
                          Các Trường Ghép Vào Mặt Sau (Back / Định Nghĩa / Lời Giải):
                        </label>
                        <span className="text-[11px] font-mono text-text-secondary font-medium">
                          Đang chọn {mapping.backFieldIndices.length} trường
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {model.fields.map((f) => {
                          const isChecked = mapping.backFieldIndices.includes(f.index);
                          const isFront = frontIndices.includes(f.index);

                          return (
                            <label
                              key={f.index}
                              className={cn(
                                'px-3 py-2 rounded-lg border text-xs flex items-center gap-2.5 cursor-pointer transition-all',
                                isChecked
                                  ? 'border-primary bg-accent-sprout/20 text-primary font-medium'
                                  : 'border-border bg-canvas text-text-secondary hover:bg-canvas-subtle',
                                isFront && 'opacity-50 pointer-events-none'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isFront}
                                onChange={() => toggleModelBackField(mid, f.index)}
                                className="rounded text-primary focus:ring-0"
                              />
                              <span className="truncate">
                                <span className="font-mono text-[10px] text-text-tertiary">[{f.index}]</span>{' '}
                                {f.name}
                                {isFront && ' (Đã ở Mặt trước)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Tùy chọn Trường Âm Thanh & Hình Ảnh Riêng Biệt */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-accent-sage" />
                          <span>Trường Âm Thanh (Audio):</span>
                        </label>
                        <select
                          value={mapping.audioFieldIndex ?? ''}
                          onChange={(e) =>
                            updateModelAudioField(
                              mid,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-xs rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-text-primary"
                        >
                          <option value="">(Tự động quét trong tất cả trường)</option>
                          {model.fields.map((f) => (
                            <option key={f.index} value={f.index}>
                              [{f.index}] {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-accent-amber" />
                          <span>Trường Hình Ảnh (Image):</span>
                        </label>
                        <select
                          value={mapping.imageFieldIndex ?? ''}
                          onChange={(e) =>
                            updateModelImageField(
                              mid,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-xs rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-text-primary"
                        >
                          <option value="">(Tự động quét trong tất cả trường)</option>
                          {model.fields.map((f) => (
                            <option key={f.index} value={f.index}>
                              [{f.index}] {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: DỮ LIỆU THÔ (RAW NOTES EXPLORER) */}
          {activeSubTab === 'explorer' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    placeholder="Tìm kiếm nội dung trong các trường dữ liệu thô..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredRawNotes.map((note, noteIdx) => {
                  const modelDef = report.models[note.modelId];
                  return (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl border border-border bg-surface space-y-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-text-tertiary border-b border-border-subtle pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-text-primary">Note #{noteIdx + 1}</span>
                          <span>(ID: {note.id})</span>
                          {modelDef && (
                            <span className="bg-canvas-subtle px-2 py-0.2 rounded-full font-mono text-[10px]">
                              {modelDef.name}
                            </span>
                          )}
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex gap-1">
                            {note.tags.map((t, ti) => (
                              <span key={ti} className="text-primary font-mono text-[10px]">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Danh sách các trường thô */}
                      <div className="space-y-1.5">
                        {note.fields.map((fieldVal, fIdx) => {
                          const fieldName = modelDef?.fields[fIdx]?.name || `Trường ${fIdx}`;
                          return (
                            <div
                              key={fIdx}
                              className="p-2 rounded-lg bg-canvas border border-border-subtle font-mono text-[11px] space-y-0.5"
                            >
                              <div className="text-text-tertiary text-[10px] flex items-center justify-between">
                                <span>
                                  [Index {fIdx}] {fieldName}
                                </span>
                              </div>
                              <div
                                className="text-text-primary break-all max-h-24 overflow-y-auto leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: fieldVal || '<span class="text-text-tertiary italic">(Trống)</span>'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredRawNotes.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-secondary text-xs">
                    Không tìm thấy ghi chú nào phù hợp với từ khóa tìm kiếm.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: XEM TRƯỚC THẺ TRỰC TIẾP (LIVE CARD PREVIEW) */}
          {activeSubTab === 'preview' && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>
                  Đang xem thẻ{' '}
                  <strong className="text-text-primary font-mono">
                    {previewCardIndex + 1}
                  </strong>{' '}
                  / <span className="font-mono">{generatedCards.length}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={previewCardIndex <= 0}
                    onClick={() => setPreviewCardIndex((i) => Math.max(0, i - 1))}
                    className="p-1 rounded-md border border-border bg-surface disabled:opacity-30 hover:bg-canvas-subtle cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={previewCardIndex >= generatedCards.length - 1}
                    onClick={() => setPreviewCardIndex((i) => Math.min(generatedCards.length - 1, i + 1))}
                    className="p-1 rounded-md border border-border bg-surface disabled:opacity-30 hover:bg-canvas-subtle cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {currentPreviewCard ? (
                <div
                  onClick={() => setPreviewFlipped((f) => !f)}
                  className={cn(
                    'min-h-[280px] p-6 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between select-none relative',
                    previewFlipped
                      ? 'bg-surface border-primary/40'
                      : 'bg-surface border-border hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                    <span className="font-mono font-semibold">
                      {previewFlipped ? 'MẶT SAU (LỜI GIẢI)' : 'MẶT TRƯỚC (CÂU HỎI)'}
                    </span>
                    <span className="italic text-[10px]">Nhấp để lật</span>
                  </div>

                  {/* Nội dung Mặt Trước / Mặt Sau */}
                  <div className="my-auto py-4 text-center space-y-3">
                    {!previewFlipped ? (
                      <div
                        className="font-serif text-2xl font-bold text-text-primary leading-snug"
                        dangerouslySetInnerHTML={{ __html: currentPreviewCard.front }}
                      />
                    ) : (
                      <div className="space-y-3 text-left">
                        {previewImageBlobUrl && (
                          <img
                            src={previewImageBlobUrl}
                            alt="Minh họa"
                            className="max-h-44 mx-auto rounded-lg object-contain border border-border shadow-2xs"
                          />
                        )}
                        <div
                          className="text-sm text-text-primary leading-relaxed space-y-2 font-sans"
                          dangerouslySetInnerHTML={{ __html: currentPreviewCard.back }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Nút phát âm thanh nếu có */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    {previewAudioBlobUrl ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio();
                        }}
                        disabled={isPlayingAudio}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-sage/20 text-primary hover:bg-accent-sage/30 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Volume2 className={cn('w-3.5 h-3.5', isPlayingAudio && 'animate-pulse text-accent-amber')} />
                        <span>{isPlayingAudio ? 'Đang phát...' : 'Nghe phát âm'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-text-tertiary italic">
                        Không có tệp âm thanh
                      </span>
                    )}

                    <span className="text-[10px] text-text-tertiary font-mono">
                      ID: {currentPreviewCard.id.slice(0, 14)}...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-secondary border border-dashed border-border rounded-xl">
                  Chưa có thẻ nào để xem trước.
                </div>
              )}
            </div>
          )}

          {/* 4. THANH HÀNH ĐỘNG CỐ ĐỊNH PHÍA DƯỚI (BOTTOM ACTION BAR) */}
          <div className="p-4 rounded-xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-text-secondary text-center sm:text-left">
              <span>Đã sẵn sàng lưu</span>{' '}
              <strong className="text-text-primary font-mono">{generatedCards.length}</strong> thẻ vào ứng dụng
              {selectedSubdeckId && (
                <span className="text-primary font-medium"> (thuộc chủ đề đã chọn)</span>
              )}
              .
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveToApp}
                disabled={isSaving || generatedCards.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu vào máy... ({progressPercent}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nhập Vào Thư Viện Thẻ Nhớ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Thông báo nhập thành công */}
          {saveSuccessDeckId && (
            <div className="p-4 rounded-xl bg-accent-sage/20 border border-accent-sage/40 text-primary text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Đã nhập thành công bộ thẻ vào thư viện học tập!</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('flashcards')}
                className="font-bold underline hover:opacity-80 cursor-pointer"
              >
                Chuyển đến Góc Ôn Tập
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
