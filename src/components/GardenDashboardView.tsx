import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { generateGardenHeatmap, calculateGardenActiveStreak } from '../utils/habitCalculations';
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
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Màn Hình Dashboard Sinh Trưởng (Garden Dashboard View)
 * Trung tâm điều khiển và trực quan hóa thành tựu phát triển bản thân theo Atomic Habits.
 * Thiết kế phong cách Modern Botanical Zen & Elera SaaS: Khung nổi, bố cục thoáng đãng, chỉ số sinh động.
 */
export const GardenDashboardView: React.FC = () => {
  const {
    habits,
    logs,
    notes,
    completionRate,
    topStreak,
    totalActiveHabits,
    completedTodayCount,
    getHabitsByRitual,
    setActiveTab,
    isCloudSynced
  } = useHabits();

  const { user, loginWithGoogle, logout, isAuthenticating, isConfigured } = useAuth();

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

  // Cấp bậc sinh trưởng dựa trên kỷ lục Streak (Identity Level)
  const growthStage = useMemo(() => {
    if (topStreak >= 30) {
      return {
        title: 'Cây Đại Thụ Kiên Định',
        desc: 'Bản sắc mới đã hòa vào tiềm thức tự nhiên của bạn.',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    }
    if (topStreak >= 14) {
      return {
        title: 'Chồi Non Vươn Mình',
        desc: 'Quán tính hành vi đang được định hình rõ nét.',
        badgeColor: 'bg-accent-sprout/25 text-[#144919] border-accent-sprout/40'
      };
    }
    if (topStreak >= 3) {
      return {
        title: 'Hạt Mầm Bắt Đầu',
        desc: 'Những viên gạch đầu tiên đang được đặt vững chắc.',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    return {
      title: 'Người Khởi Tâm Gieo Hạt',
      desc: 'Hành trình vạn dặm bắt đầu từ 1 hành động 2 phút.',
      badgeColor: 'bg-canvas-subtle text-text-secondary border-border'
    };
  }, [topStreak]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Khung Hero: Cấp Bậc Sinh Trưởng & Trạng Thái Đồng Bộ */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-sprout/20 text-[#103813] border border-accent-sprout/40 shadow-2xs shrink-0">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-text-primary">
                  {growthStage.title}
                </h2>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', growthStage.badgeColor)}>
                  Kỷ lục {topStreak}d
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {growthStage.desc}
              </p>
            </div>
          </div>

          {/* Trạng thái Cloud Sync */}
          <div className="flex items-center gap-2 text-xs">
            {isCloudSynced ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-semantic-green-bg text-[#144919] border border-semantic-green/30 font-semibold">
                <Cloud className="w-3.5 h-3.5 text-accent-sprout" />
                <span>Đã đồng bộ Cloud</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas-subtle text-text-tertiary border border-border/70 font-medium">
                <CloudOff className="w-3.5 h-3.5" />
                <span>Chế độ Khách (Local)</span>
              </div>
            )}
          </div>
        </div>

        {/* Thanh đề từ triết lý James Clear */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
          <span className="flex items-center gap-1.5 italic">
            <Sparkles className="w-3.5 h-3.5 text-accent-sprout shrink-0" />
            &ldquo;Tập trung vào hệ thống thay vì mục tiêu viển vông.&rdquo;
          </span>
          <span className="font-mono text-[11px] font-semibold text-text-secondary">
            {completedTodayCount}/{totalActiveHabits} hôm nay
          </span>
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

      {/* 3. Obsidian Habit Matrix: Lịch Ma Trận Chuỗi Ngày Nền Than Đá Cao Cấp */}
      <div className="rounded-2xl bg-dark-surface p-5 sm:p-6 text-dark-text shadow-lg border border-[#2F3532] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#313734] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-sprout/15 text-accent-sprout border border-accent-sprout/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-white">
                Ma Trận Kiên Trì (Obsidian Habit Matrix)
              </h3>
              <p className="text-xs text-dark-text-subtle">
                Trực quan hóa hành vi trong 4 tuần qua • Chuỗi hiện tại: <span className="text-accent-sprout font-bold">{gardenActiveStreak} ngày</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-accent-sprout bg-accent-sprout/15 px-3 py-1 rounded-full border border-accent-sprout/30 self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 fill-accent-sprout" />
            <span>28 ngày gần nhất</span>
          </div>
        </div>

        {/* Lưới 28 ô vuông / tròn ma trận */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 max-w-md mx-auto py-2">
          {heatmapCells.map((cell, i) => {
            const dayNumber = new Date(cell.date).getDate();
            const isCompleted = cell.level >= 2;
            const isPartial = cell.level === 1;

            return (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-mono text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-110 select-none relative group',
                  isCompleted
                    ? 'bg-accent-sprout text-[#103813] font-extrabold shadow-sm'
                    : isPartial
                    ? 'bg-[#3A4D3E] text-[#9FE58F]'
                    : 'bg-[#2C312E] text-[#78857D] hover:bg-[#383F3B]',
                  cell.isToday && 'ring-2 ring-white ring-offset-2 ring-offset-dark-surface'
                )}
                title={`${cell.date}: Hoàn thành ${cell.completedCount}/${cell.totalHabits} thói quen`}
              >
                <span>{dayNumber}</span>
                {cell.completedCount > 0 && (
                  <span className="text-[8px] font-normal opacity-80 -mt-0.5">
                    {cell.completedCount}✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Chú giải trạng thái (Legend) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-dark-text-subtle pt-3 border-t border-[#313734]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-[#2C312E]" /> Nghỉ ngơi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-[#3A4D3E]" /> Một phần
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-accent-sprout" /> Đạt chuẩn
            </span>
          </div>
          <span className="text-[11px] italic text-dark-text-subtle/80">
            *Ô viền trắng là hôm nay
          </span>
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
