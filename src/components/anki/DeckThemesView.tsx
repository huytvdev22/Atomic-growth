import React, { useMemo } from 'react';
import { AnkiCard, calculateCardVitality } from '../../types/anki';
import {
  Sparkles,
  Flame,
  Sprout,
  TreeDeciduous,
  Play,
  ArrowRight,
  BookOpen,
  Layers
} from 'lucide-react';

export interface ThemeGroup {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  cardIds: string[];
  steadyCount: number;
}

interface DeckThemesViewProps {
  cards: AnkiCard[];
  onSelectTheme: (theme: ThemeGroup) => void;
  onReviewTheme: (theme: ThemeGroup) => void;
}

/**
 * Giao diện Lưới Chủ Đề & Phân Nhóm Bài Học (DeckThemesView)
 * - Tự động gom nhóm theo các Phân Nhóm Bài Học / Subdeck của Anki (01. Contract, 02. Marketing...)
 * - Tự động gom nhóm theo 4 nhịp sinh trưởng Botanical Zen (Fragile, Growing, Steady, New)
 * - Cho phép ôn tập 2 phút theo từng bài học cụ thể
 */
export const DeckThemesView: React.FC<DeckThemesViewProps> = ({
  cards,
  onSelectTheme,
  onReviewTheme
}) => {
  // Bảng màu pastel nhẹ nhàng theo phong cách Botanical Zen
  const pastelPalette = [
    { bg: 'bg-[#F4F1EA] hover:bg-[#ECE7DC]', border: 'border-[#E2DC Flora]', text: 'text-text-primary' },
    { bg: 'bg-[#F0F4F8] hover:bg-[#E2ECF4]', border: 'border-[#D0E0EE]', text: 'text-[#3E6B89]' },
    { bg: 'bg-[#F8F2F7] hover:bg-[#EFE5ED]', border: 'border-[#E5D2E2]', text: 'text-[#874E79]' },
    { bg: 'bg-[#F9F7EE] hover:bg-[#F3EFDF]', border: 'border-[#E7DEC1]', text: 'text-[#8A6D3B]' },
    { bg: 'bg-[#F3F7F5] hover:bg-[#E8F1EC]', border: 'border-[#D4E4DC]', text: 'text-[#205A42]' }
  ];

  // 1. Phân tích các nhóm Bài Học (Subdecks / Phân nhóm chủ đề)
  const lessonGroups = useMemo(() => {
    const subdeckMap: Record<string, string[]> = {};
    const steadyMap: Record<string, number> = {};

    cards.forEach((card) => {
      const vitality = calculateCardVitality(card);
      const isSteady = vitality === 'steady';

      // Ưu tiên subdeckName, nếu không có thì lấy tag đầu tiên
      const lessonName =
        card.subdeckName ||
        (card.tags && card.tags.length > 0 ? card.tags[0] : undefined);

      if (lessonName) {
        const cleanName = lessonName.trim();
        if (!subdeckMap[cleanName]) {
          subdeckMap[cleanName] = [];
          steadyMap[cleanName] = 0;
        }
        subdeckMap[cleanName].push(card.id);
        if (isSteady) {
          steadyMap[cleanName]++;
        }
      }
    });

    const groups: ThemeGroup[] = [];
    let colorIdx = 0;

    // Sắp xếp các bài học theo thứ tự chữ cái / số (01, 02, 03...)
    const sortedLessons = Object.keys(subdeckMap).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    sortedLessons.forEach((lessonName) => {
      const cIds = subdeckMap[lessonName];
      const palette = pastelPalette[colorIdx % pastelPalette.length];
      colorIdx++;

      groups.push({
        id: `lesson-${lessonName}`,
        title: lessonName,
        subtitle: `Bài học • ${cIds.length} từ vựng`,
        icon: <BookOpen className="w-5 h-5 text-primary" />,
        bgClass: palette.bg,
        borderClass: palette.border,
        textClass: palette.text,
        cardIds: cIds,
        steadyCount: steadyMap[lessonName] || 0
      });
    });

    return groups;
  }, [cards]);

  // 2. Phân tích các nhóm Nhịp Sinh Trưởng Ghi Nhớ (Fragile / Growing / Steady / New)
  const vitalityGroups = useMemo(() => {
    const fragileIds: string[] = [];
    const growingIds: string[] = [];
    const steadyIds: string[] = [];
    const newIds: string[] = [];

    cards.forEach((card) => {
      const vitality = calculateCardVitality(card);
      if (card.reps === 0) {
        newIds.push(card.id);
      } else if (vitality === 'fragile') {
        fragileIds.push(card.id);
      } else if (vitality === 'growing') {
        growingIds.push(card.id);
      } else {
        steadyIds.push(card.id);
      }
    });

    const groups: ThemeGroup[] = [];

    if (fragileIds.length > 0) {
      groups.push({
        id: 'theme-fragile',
        title: 'Cần Cứu Cánh (Fragile)',
        subtitle: 'Trí nhớ đang mờ nhạt, cần ôn gấp',
        icon: <Flame className="w-5 h-5 text-accent-clay" />,
        bgClass: 'bg-[#FDF4F0] hover:bg-[#FBEBE5]',
        borderClass: 'border-[#F7DDD2]',
        textClass: 'text-accent-clay',
        cardIds: fragileIds,
        steadyCount: 0
      });
    }

    if (growingIds.length > 0) {
      groups.push({
        id: 'theme-growing',
        title: 'Đang Lớn Dần (Growing)',
        subtitle: 'Đang hình thành liên kết thần kinh',
        icon: <Sprout className="w-5 h-5 text-accent-sage" />,
        bgClass: 'bg-[#F1F7F3] hover:bg-[#E5F0E9]',
        borderClass: 'border-[#D2E6DA]',
        textClass: 'text-accent-sage',
        cardIds: growingIds,
        steadyCount: 0
      });
    }

    if (steadyIds.length > 0) {
      groups.push({
        id: 'theme-steady',
        title: 'Đã Vững Chãi (Steady)',
        subtitle: 'Khắc sâu vào trí nhớ dài hạn',
        icon: <TreeDeciduous className="w-5 h-5 text-primary" />,
        bgClass: 'bg-[#ECF4F0] hover:bg-[#DEEDE5]',
        borderClass: 'border-[#C7E2D3]',
        textClass: 'text-primary',
        cardIds: steadyIds,
        steadyCount: steadyIds.length
      });
    }

    if (newIds.length > 0) {
      groups.push({
        id: 'theme-new',
        title: 'Hạt Mầm Mới (Chưa học)',
        subtitle: 'Chờ được đánh thức trong các phiên tới',
        icon: <Sparkles className="w-5 h-5 text-accent-ochre" />,
        bgClass: 'bg-[#FAF7EE] hover:bg-[#F5F0DF]',
        borderClass: 'border-[#EDE4C8]',
        textClass: 'text-accent-ochre',
        cardIds: newIds,
        steadyCount: 0
      });
    }

    return groups;
  }, [cards]);

  if (cards.length === 0) {
    return null;
  }

  // Component phụ render từng thẻ chủ đề
  const renderThemeCard = (theme: ThemeGroup, actionText: string = 'Ôn tập') => {
    const totalInTheme = theme.cardIds.length;
    const steadyRatio =
      totalInTheme > 0 ? Math.round((theme.steadyCount / totalInTheme) * 100) : 0;

    return (
      <div
        key={theme.id}
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer shadow-2xs group ${theme.bgClass} ${theme.borderClass}`}
        onClick={() => onSelectTheme(theme)}
      >
        {/* Header của thẻ chủ đề */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-canvas/80 backdrop-blur-xs border border-border-subtle shrink-0">
              {theme.icon}
            </div>
            <div className="min-w-0">
              <h5 className="font-serif text-sm sm:text-base font-bold text-text-primary leading-tight group-hover:text-primary transition-colors truncate">
                {theme.title}
              </h5>
              {theme.subtitle && (
                <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                  {theme.subtitle}
                </p>
              )}
            </div>
          </div>

          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-canvas/90 border border-border-subtle text-text-primary shrink-0">
            {totalInTheme} từ
          </span>
        </div>

        {/* Thanh tiến độ nhỏ & Nút hành động */}
        <div className="pt-1 flex items-center justify-between gap-3 border-t border-border-subtle/50">
          <div className="flex-1 max-w-[120px]">
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary mb-1">
              <span>Đã vững</span>
              <span>{steadyRatio}%</span>
            </div>
            <div className="w-full bg-border-subtle/80 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${steadyRatio}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReviewTheme(theme);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas hover:bg-canvas-subtle text-text-primary border border-border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:scale-102"
              title={`Bắt đầu phiên ôn 2 phút cho nhóm ${theme.title}`}
            >
              <Play className="w-3 h-3 text-primary fill-primary" />
              <span>{actionText}</span>
            </button>

            <div className="p-1 rounded-full text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 py-2">
      {/* 1. Khu Vực Phân Nhóm Bài Học (Subdecks - nếu có) */}
      {lessonGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h4 className="font-serif text-sm sm:text-base font-bold text-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                <span>Phân Nhóm Bài Học ({lessonGroups.length} bài)</span>
              </h4>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Ôn tập tập trung 2 phút theo từng chủ đề bài học cụ thể
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lessonGroups.map((theme) => renderThemeCard(theme, 'Ôn bài này'))}
          </div>
        </div>
      )}

      {/* 2. Khu Vực Cấp Độ Sinh Trưởng Ghi Nhớ (Fragile / Growing / Steady / New) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-text-primary flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-accent-sage" />
              <span>Cấp Độ Sinh Trưởng Ghi Nhớ</span>
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Phân nhóm theo chu kỳ ghi nhớ ngắt quãng (Spaced Repetition)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vitalityGroups.map((theme) => renderThemeCard(theme, 'Ôn nhóm'))}
        </div>
      </div>
    </div>
  );
};
