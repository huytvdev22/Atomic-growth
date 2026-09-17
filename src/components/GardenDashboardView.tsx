import React, { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { generateGardenHeatmap, calculateGardenActiveStreak, HeatmapCell } from '../utils/habitCalculations';
import { VersionBadge } from './VersionBadge';
import {
  Sprout,
  Flame,
  CheckCircle2,
  Calendar,
  BookOpen,
  Brain,
  FileCode,
  Archive,
  Cloud,
  CloudOff,
  User as UserIcon,
  LogOut,
  Loader2,
  Sunrise,
  Compass,
  Moon,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Màn Hình Dashboard Sinh Trưởng (Garden Dashboard View)
 * Trung tâm điều khiển và trực quan hóa thành tựu phát triển bản thân theo Atomic Habits.
 * Thiết kế phong cách Botanical Zen: Tone sáng thanh thoát, bố cục tối giản, chống rườm rà.
 */
export const GardenDashboardView: React.FC = () => {
  const {
    habits,
    logs,
    notes,
    completionRate,
    topStreak,
    totalActiveHabits,
    getHabitsByRitual,
    setActiveTab,
    isCloudSynced
  } = useHabits();

  const { user, loginWithGoogle, logout, isAuthenticating, isConfigured } = useAuth();

  // State tương tác: ô được chọn trong Ma Trận Kiên Trì
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<HeatmapCell | null>(null);

  // Tạo dữ liệu cho Ma Trận Kiên Trì 28 ngày (4 tuần gần nhất)
  const heatmapCells = useMemo(() => {
    return generateGardenHeatmap(logs, totalActiveHabits, 28);
  }, [logs, totalActiveHabits]);

  // Tính chuỗi ngày kiên trì liên tục của toàn bộ khu vườn
  const gardenActiveStreak = useMemo(() => {
    return calculateGardenActiveStreak(logs);
  }, [logs]);

  // Thống kê phân bố theo nhịp sinh học
  const morningCount = getHabitsByRitual('morning').length;
  const middayCount = getHabitsByRitual('midday').length;
  const eveningCount = getHabitsByRitual('evening').length;

  // Thống kê theo 4 danh mục cốt lõi
  const categoryBreakdown = useMemo(() => {
    const counts = { health: 0, mind: 0, focus: 0, gratitude: 0 };
    habits.forEach((h) => {
      if (counts[h.category] !== undefined) {
        counts[h.category]++;
      }
    });
    return counts;
  }, [habits]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Trang Tinh Giản (Loại bỏ khối cồng kềnh "Người khởi tâm gieo hạt", giữ trọn tinh thần Zen Minimalist) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Khu Vườn Sinh Trưởng
            </h2>
            {topStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-amber/15 text-[#8A6D3B] text-[11px] font-mono font-bold border border-accent-amber/30 shrink-0">
                <Flame className="w-3 h-3 text-accent-amber fill-accent-amber" />
                <span>Kỷ lục {topStreak} ngày</span>
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Trực quan hóa thành tựu và tiến trình phát triển bản thân mỗi ngày
          </p>
        </div>

        {/* Trạng thái Cloud Sync tinh gọn */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isCloudSynced ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-semantic-green-bg text-[#144919] border border-semantic-green/30 text-xs font-semibold shadow-2xs">
              <Cloud className="w-3.5 h-3.5 text-accent-sprout" />
              <span>Đã đồng bộ Cloud</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas border border-border text-text-tertiary text-xs font-medium shadow-2xs">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Chế độ Khách (Local)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Bộ 4 Khối Chỉ Số Trực Quan (4 Metric Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chỉ số 1: Tỉ lệ hoàn thành hôm nay */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-accent-sprout/60 transition-all">
          <div className="flex items-center justify-between text-text-tertiary mb-2">
            <span className="text-xs font-semibold text-text-secondary">Hôm nay</span>
            <CheckCircle2 className="w-4 h-4 text-accent-sprout" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-accent-sprout">
              {completionRate}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-canvas-subtle overflow-hidden">
            <div
              className="h-full bg-accent-sprout rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Chỉ số 2: Kỷ lục chuỗi ngày kiên trì */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-semantic-amber/60 transition-all">
          <div className="flex items-center justify-between text-text-tertiary mb-2">
            <span className="text-xs font-semibold text-text-secondary">Kỷ lục Streak</span>
            <Flame className="w-4 h-4 text-semantic-amber fill-semantic-amber" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-semantic-amber">
              {topStreak}
            </span>
            <span className="text-xs text-text-tertiary font-mono">ngày</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Never Miss Twice bảo vệ
          </p>
        </div>

        {/* Chỉ số 3: Tổng số thói quen đang duy trì */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-text-tertiary mb-2">
            <span className="text-xs font-semibold text-text-secondary">Thói quen</span>
            <Sprout className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-text-primary">
              {totalActiveHabits}
            </span>
            <span className="text-xs text-text-tertiary font-mono">hạt mầm</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Chia 3 nhịp sinh học
          </p>
        </div>

        {/* Chỉ số 4: Kho tàng bài học phản tư */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-semantic-sky/60 transition-all">
          <div className="flex items-center justify-between text-text-tertiary mb-2">
            <span className="text-xs font-semibold text-text-secondary">Bài học phản tư</span>
            <BookOpen className="w-4 h-4 text-semantic-sky" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#1F59B3]">
              {notes.length}
            </span>
            <span className="text-xs text-text-tertiary font-mono">ghi chép</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Chuyển hóa nhận thức
          </p>
        </div>
      </div>

      {/* 3. Ma Trận Kiên Trì Theme Sáng (Botanical Zen Garden Matrix) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-sprout/60 text-primary">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold tracking-tight text-text-primary">
                Ma Trận Kiên Trì (Habit Garden Matrix)
              </h3>
              <p className="text-xs text-text-secondary">
                Trực quan hóa 4 tuần qua • Chuỗi hiện tại: <strong className="text-primary font-mono">{gardenActiveStreak} ngày</strong>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-accent-amber bg-accent-amber/15 px-3 py-1 rounded-full border border-accent-amber/20 self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 text-accent-amber fill-accent-amber" />
            <span>28 ngày gần nhất</span>
          </div>
        </div>

        {/* Lưới 28 ô vuông sinh trưởng màu sáng Botanical Zen */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 max-w-md mx-auto py-2">
          {heatmapCells.map((cell, i) => {
            const dayNumber = new Date(cell.date).getDate();
            const isCellSelected = selectedHeatmapCell?.date === cell.date;

            // Phân cấp màu sắc xanh Botanical Zen sáng
            let cellColorClass = 'bg-[#EFF1ED] border border-border-subtle text-text-tertiary hover:bg-canvas-subtle';
            if (cell.level === 1) {
              cellColorClass = 'bg-[#EAF7E6] border border-[#D4EED0] text-[#144919] font-medium';
            } else if (cell.level === 2) {
              cellColorClass = 'bg-[#A8DF98] border border-[#8ECBA2] text-[#103813] font-bold';
            } else if (cell.level === 3) {
              cellColorClass = 'bg-[#6DC85A] border border-[#528B70] text-white font-bold shadow-2xs';
            } else if (cell.level === 4) {
              cellColorClass = 'bg-primary border border-primary text-white font-extrabold shadow-xs';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedHeatmapCell(cell)}
                className={cn(
                  'aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-mono text-xs transition-all duration-200 cursor-pointer select-none relative group focus:outline-none',
                  cellColorClass,
                  isCellSelected ? 'ring-2 ring-accent-clay ring-offset-2 scale-110 z-10' : 'hover:scale-105',
                  cell.isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                )}
                title={`${cell.date}: Hoàn thành ${cell.completedCount}/${cell.totalHabits} thói quen${cell.isToday ? ' (Hôm nay)' : ''}`}
              >
                <span>{dayNumber}</span>
                {cell.completedCount > 0 && (
                  <span className="text-[8px] opacity-85 -mt-0.5">
                    {cell.completedCount}✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chú giải trạng thái & Thông tin ô đang chọn */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary pt-3 border-t border-border-subtle">
          <div className="font-mono text-[11px] min-w-0">
            {selectedHeatmapCell ? (
              <span className="text-primary font-bold">
                {selectedHeatmapCell.date}: {selectedHeatmapCell.completedCount}/{selectedHeatmapCell.totalHabits} thói quen hoàn thành
              </span>
            ) : (
              <span className="text-text-tertiary">Chạm vào ô để xem chi tiết ngày</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-[#EFF1ED] border border-border-subtle inline-block" /> Nghỉ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-[#EAF7E6] border border-[#D4EED0] inline-block" /> Một phần
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-[#A8DF98] inline-block" /> Đạt chuẩn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-primary inline-block" /> Xuất sắc
            </span>
          </div>
        </div>
      </div>

      {/* 4. Phân Bố Nhịp Sinh Học & Danh Mục Cốt Lõi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nhịp sinh học */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-3">
          <h3 className="font-serif text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span>Phân Bổ Nhịp Sinh Học</span>
          </h3>
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-canvas-subtle/70">
              <div className="flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-text-primary">Rạng Đông (Sáng)</span>
              </div>
              <span className="font-mono font-bold text-text-secondary">{morningCount} thói quen</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-canvas-subtle/70">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-text-primary">Tập Trung (Trưa)</span>
              </div>
              <span className="font-mono font-bold text-text-secondary">{middayCount} thói quen</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-canvas-subtle/70">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-text-primary">Lắng Đọng (Tối)</span>
              </div>
              <span className="font-mono font-bold text-text-secondary">{eveningCount} thói quen</span>
            </div>
          </div>
        </div>

        {/* Danh mục */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-3">
          <h3 className="font-serif text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-sprout" />
            <span>Trọng Tâm Phát Triển</span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-canvas-subtle/70 space-y-1">
              <span className="text-text-tertiary block text-[11px]">Sức khỏe</span>
              <span className="font-mono text-lg font-bold text-text-primary">{categoryBreakdown.health}</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas-subtle/70 space-y-1">
              <span className="text-text-tertiary block text-[11px]">Tâm trí</span>
              <span className="font-mono text-lg font-bold text-text-primary">{categoryBreakdown.mind}</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas-subtle/70 space-y-1">
              <span className="text-text-tertiary block text-[11px]">Trí tuệ</span>
              <span className="font-mono text-lg font-bold text-text-primary">{categoryBreakdown.focus}</span>
            </div>
            <div className="p-3 rounded-xl bg-canvas-subtle/70 space-y-1">
              <span className="text-text-tertiary block text-[11px]">Biết ơn</span>
              <span className="font-mono text-lg font-bold text-text-primary">{categoryBreakdown.gratitude}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Trung Tâm Tiện Ích & Tài Khoản (Account & Quick Hub) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <h3 className="font-serif text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Tài Khoản & Tiện Ích Mở Rộng</span>
        </h3>

        {/* Khu vực tài khoản Google */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-canvas-subtle/60 border border-border-subtle">
          {user ? (
            <div className="flex items-center gap-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-10 h-10 rounded-full border border-border shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-sprout text-[#103813] flex items-center justify-center font-bold text-sm shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user.displayName || 'Người dùng'}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-text-primary">
                Chế độ Khách (Dữ liệu cục bộ thiết bị)
              </p>
              <p className="text-[11px] text-text-tertiary">
                Đăng nhập Google để lưu trữ vĩnh viễn trên đám mây Firestore
              </p>
            </div>
          )}

          <div>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-error hover:bg-canvas transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isAuthenticating}
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-2 rounded-full bg-[#19241E] px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-sprout" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
            {!isConfigured && !user && (
              <p className="text-[10px] text-text-tertiary mt-1 text-center sm:text-right">
                Chưa cấu hình Firebase (Chế độ Ngoại tuyến)
              </p>
            )}
          </div>
        </div>

        {/* 3 Lối tắt tiện ích */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-canvas hover:bg-surface hover:border-accent-sprout/60 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-semantic-sky" />
              <span className="text-xs font-semibold text-text-primary">Góc Ôn Tập Anki</span>
            </div>
            <span className="text-[10px] font-mono text-semantic-sky bg-semantic-sky-bg px-2 py-0.5 rounded-full font-bold">
              2m
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('anki-decoder')}
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-canvas hover:bg-surface hover:border-semantic-amber/60 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-semantic-amber" />
              <span className="text-xs font-semibold text-text-primary">Giải Mã Anki Deck</span>
            </div>
            <span className="text-[10px] font-mono text-semantic-amber bg-semantic-amber-bg px-2 py-0.5 rounded-full font-bold">
              Studio
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-canvas hover:bg-surface hover:border-border transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs font-semibold text-text-primary">Khu Vườn Lưu Trữ</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>

        {/* Version Badge footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-text-tertiary">
          <VersionBadge />
          <span>Atomic Growth • Modern Botanical Zen v2.0.0</span>
        </div>
      </div>
    </div>
  );
};
