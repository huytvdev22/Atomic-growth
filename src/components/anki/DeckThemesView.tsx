import React, { useMemo } from 'react';
import { AnkiCard, calculateCardVitality } from '../../types/anki';
import {
  Sparkles,
  Flame,
  Sprout,
  TreeDeciduous,
  Tag,
  Play,
  ArrowRight
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
 * Giao diện Lưới Chủ Đề Pastel (DeckThemesView)
 * Lấy cảm hứng từ thiết kế Topics dạng thẻ tròn trịa, mềm mại của ứng dụng Mural:
 * - Tự động gom nhóm theo thẻ tags của Anki (nếu có)
 * - Tự động gom nhóm theo 4 nhịp sinh trưởng Botanical Zen:
 *   + Hạt mầm mong manh (Fragile - Cần cứu cánh)
 *   + Chồi non đang lớn (Growing - Cần chăm sóc)
 *   + Cổ thụ vững chãi (Steady - Đã khắc sâu)
 *   + Hạt mầm tinh khôi (New - Chưa gieo)
 */
export const DeckThemesView: React.FC<DeckThemesViewProps> = ({
  cards,
  onSelectTheme,
  onReviewTheme
}) => {
  // Phân tích và tạo danh sách các nhóm chủ đề
  const themeGroups = useMemo(() => {
    const groups: ThemeGroup[] = [];

    // 1. Phân nhóm theo 4 giai đoạn sinh trưởng
    const fragileIds: string[] = [];
    const growingIds: string[] = [];
    const steadyIds: string[] = [];
    const newIds: string[] = [];

    // Bảng đếm các tag có sẵn trong bộ thẻ
    const tagMap: Record<string, string[]> = {};

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

      // Đếm tags tùy chỉnh
      if (card.tags && card.tags.length > 0) {
        card.tags.forEach((t) => {
          const cleanTag = t.trim().toLowerCase();
          if (!cleanTag) return;
          if (!tagMap[cleanTag]) tagMap[cleanTag] = [];
          tagMap[cleanTag].push(card.id);
        });
      }
    });

    // Thêm nhóm Fragile nếu có từ
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

    // Thêm nhóm Growing nếu có từ
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

    // Thêm nhóm Steady nếu có từ
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

    // Thêm nhóm Chưa học (New) nếu có
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

    // 2. Thêm các nhóm Tag thực tế của bộ thẻ nếu có
    const pastelPalette = [
      { bg: 'bg-[#F4F1EA] hover:bg-[#ECE7DC]', border: 'border-[#E2DC Flora]', text: 'text-text-primary' },
      { bg: 'bg-[#F0F4F8] hover:bg-[#E2ECF4]', border: 'border-[#D0E0EE]', text: 'text-[#3E6B89]' },
      { bg: 'bg-[#F8F2F7] hover:bg-[#EFE5ED]', border: 'border-[#E5D2E2]', text: 'text-[#874E79]' },
      { bg: 'bg-[#F9F7EE] hover:bg-[#F3EFDF]', border: 'border-[#E7DEC1]', text: 'text-[#8A6D3B]' }
    ];

    let colorIdx = 0;
    Object.entries(tagMap).forEach(([tagName, cIds]) => {
      // Chỉ tạo nhóm nếu tag có từ 2 thẻ trở lên
      if (cIds.length >= 2) {
        const palette = pastelPalette[colorIdx % pastelPalette.length];
        colorIdx++;

        const steadyInTag = cIds.filter((id) => steadyIds.includes(id)).length;

        groups.push({
          id: `tag-${tagName}`,
          title: `#${tagName}`,
          subtitle: `Chủ đề ${tagName}`,
          icon: <Tag className="w-4 h-4 opacity-75" />,
          bgClass: palette.bg,
          borderClass: palette.border,
          textClass: palette.text,
          cardIds: cIds,
          steadyCount: steadyInTag
        });
      }
    });

    return groups;
  }, [cards]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h4 className="font-serif text-sm sm:text-base font-bold text-text-primary">
            Chủ Đề & Cấp Độ Sinh Trưởng
          </h4>
          <p className="text-[11px] text-text-secondary">
            Khám phá và luyện tập theo từng nhóm hạt mầm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themeGroups.map((theme) => {
          const totalInTheme = theme.cardIds.length;
          const steadyRatio =
            totalInTheme > 0
              ? Math.round((theme.steadyCount / totalInTheme) * 100)
              : 0;

          return (
            <div
              key={theme.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer shadow-2xs group ${theme.bgClass} ${theme.borderClass}`}
              onClick={() => onSelectTheme(theme)}
            >
              {/* Header của thẻ chủ đề */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-canvas/80 backdrop-blur-xs border border-border-subtle shrink-0">
                    {theme.icon}
                  </div>
                  <div>
                    <h5 className="font-serif text-sm sm:text-base font-bold text-text-primary leading-tight group-hover:text-primary transition-colors">
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
                    title={`Ôn tập nhóm ${theme.title}`}
                  >
                    <Play className="w-3 h-3 text-primary fill-primary" />
                    <span>Ôn nhóm</span>
                  </button>

                  <div className="p-1 rounded-full text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
