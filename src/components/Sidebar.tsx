import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { generateGardenHeatmap } from '../utils/habitCalculations';
import {
  Sprout,
  Settings,
  Calendar,
  BookOpen,
  Archive,
  Brain,
  FileCode,
  Hash,
  LogOut,
  Cloud,
  CloudOff,
  User as UserIcon,
  Loader2,
  Flame
} from 'lucide-react';
import { cn } from '../utils/cn';
import { VersionBadge } from './VersionBadge';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Sidebar Điều Hướng Chuẩn Elera (Modern Botanical Zen Sidebar)
 * Tích hợp Widget Obsidian Habit Matrix nền than sẫm sang trọng và menu dạng Pill mềm mại
 */
export const Sidebar: React.FC<SidebarProps> = () => {
  const onCloseMobile = () => {};
  const {
    habits,
    logs,
    notes,
    completionRate,
    topStreak,
    activeTab,
    setActiveTab,
    activeTag,
    setActiveTag,
    totalActiveHabits,
    isCloudSynced
  } = useHabits();

  const { user, loginWithGoogle, logout, isConfigured, isAuthenticating } = useAuth();

  // Sinh 28 ô vuông (4 tuần) cho Obsidian Habit Matrix trong sidebar
  const miniHeatmapCells = useMemo(() => {
    return generateGardenHeatmap(logs, totalActiveHabits, 28);
  }, [logs, totalActiveHabits]);

  // Các thẻ danh mục tags có sẵn
  const tags = [
    { id: 'health', label: 'Sức-khỏe' },
    { id: 'mind', label: 'Tâm-trí' },
    { id: 'focus', label: 'Trí-tuệ' },
    { id: 'gratitude', label: 'Biết-ơn' }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface text-text-primary select-none">
      {/* 1. Header Logo & Cài Đặt Phong Cách Elera */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-sprout text-[#103813] shadow-xs font-bold">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-sm font-bold tracking-tight text-text-primary">
              Atomic Growth
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              {isCloudSynced ? (
                <>
                  <Cloud className="h-3 w-3 text-accent-sprout" />
                  <span className="text-accent-sprout font-medium">Đồng bộ Cloud</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3 text-text-tertiary" />
                  <span>Chế độ Khách (Local)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-full p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
            title="Cài đặt"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Bộ 3 Chỉ Số Lớn (Top Counters) với JetBrains Mono */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border-subtle text-center">
        <div className="flex flex-col">
          <span className="font-mono text-lg font-bold text-text-primary">
            {habits.length}
          </span>
          <span className="text-[10px] text-text-tertiary">Thói quen</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-lg font-bold text-semantic-amber">
            {topStreak}d
          </span>
          <span className="text-[10px] text-text-tertiary">Kỷ lục</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-lg font-bold text-accent-sprout">
            {completionRate}%
          </span>
          <span className="text-[10px] text-text-tertiary">Hôm nay</span>
        </div>
      </div>

      {/* 3. Obsidian Habit Matrix (Widget Lịch Ma Trận Chuỗi Ngày Nền Than Đá Cao Cấp) */}
      <div className="px-3 py-2.5 border-b border-border-subtle">
        <div className="rounded-2xl bg-dark-surface p-3 text-dark-text shadow-sm border border-[#2F3532]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent-sprout" />
              <span className="text-xs font-semibold tracking-tight text-white">
                Ma Trận Kiên Trì
              </span>
            </div>
            <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-accent-sprout bg-accent-sprout/15 px-2 py-0.5 rounded-full border border-accent-sprout/30">
              <Flame className="w-2.5 h-2.5 fill-accent-sprout" />
              <span>4 tuần</span>
            </div>
          </div>

          {/* Lưới 28 ô tròn ma trận */}
          <div className="grid grid-cols-7 gap-1">
            {miniHeatmapCells.map((cell, i) => {
              const dayNumber = new Date(cell.date).getDate();
              const isCompleted = cell.level >= 2;
              const isPartial = cell.level === 1;

              return (
                <div
                  key={i}
                  className={cn(
                    'aspect-square rounded-full flex items-center justify-center font-mono text-[9px] font-semibold transition-all duration-150 cursor-pointer hover:scale-120',
                    isCompleted
                      ? 'bg-accent-sprout text-[#103813] font-bold shadow-2xs'
                      : isPartial
                      ? 'bg-[#3A4D3E] text-[#9FE58F]'
                      : 'bg-[#2C312E] text-[#78857D] hover:bg-[#353C38]',
                    cell.isToday && 'ring-2 ring-white ring-offset-1 ring-offset-dark-surface'
                  )}
                  title={`${cell.date}: Hoàn thành ${cell.completedCount} thói quen`}
                >
                  {dayNumber}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[9px] text-dark-text-subtle mt-2 pt-1.5 border-t border-[#313734]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C312E]" /> Nghỉ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-sprout" /> Đạt chuẩn
            </span>
          </div>
        </div>
      </div>

      {/* 4. Menu Điều Hướng Dạng Pill Mềm Mại */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('timeline');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'timeline' && activeTag === null
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className={cn('h-4 w-4', activeTab === 'timeline' && activeTag === null ? 'text-[#144919]' : 'text-text-tertiary')} />
            <span>Dòng thời gian (Hôm nay)</span>
          </div>
          <span className="font-mono text-[11px] bg-white/90 text-text-secondary px-2 py-0.5 rounded-full border border-border/60">
            {habits.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'dashboard'
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Sprout className={cn('h-4 w-4', activeTab === 'dashboard' ? 'text-[#144919]' : 'text-text-tertiary')} />
            <span>Khu Vườn Sinh Trưởng</span>
          </div>
          <span className="font-mono text-[10px] bg-accent-sprout/20 text-[#144919] px-2 py-0.5 rounded-full font-bold">
            Zen
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reflections');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'reflections'
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className={cn('h-4 w-4', activeTab === 'reflections' ? 'text-[#144919]' : 'text-text-tertiary')} />
            <span>Nhật ký Phản tư</span>
          </div>
          <span className="font-mono text-[11px] bg-white/90 text-text-secondary px-2 py-0.5 rounded-full border border-border/60">
            {notes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('flashcards');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'flashcards'
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Brain className={cn('h-4 w-4', activeTab === 'flashcards' ? 'text-[#144919]' : 'text-text-tertiary')} />
            <span>Góc Ôn Tập (Anki)</span>
          </div>
          <span className="font-mono text-[10px] bg-semantic-sky-bg text-semantic-sky px-2 py-0.5 rounded-full font-semibold border border-semantic-sky/20">
            2m
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('anki-decoder');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'anki-decoder'
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <FileCode className={cn('h-4 w-4', activeTab === 'anki-decoder' ? 'text-accent-amber' : 'text-text-tertiary')} />
            <span>Giải Mã Anki Deck</span>
          </div>
          <span className="font-mono text-[10px] bg-semantic-amber-bg text-semantic-amber px-2 py-0.5 rounded-full font-semibold border border-semantic-amber/20">
            Studio
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('archive');
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'archive'
              ? 'bg-accent-sprout/20 text-[#144919] font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Archive className="h-4 w-4 text-text-tertiary" />
            <span>Lưu trữ</span>
          </div>
          <span className="font-mono text-[11px] text-text-tertiary">0</span>
        </button>

        {/* Phân cách */}
        <div className="pt-2 pb-1 px-3">
          <div className="h-px bg-border-subtle" />
        </div>

        {/* Danh Mục Tags Dạng Pill */}
        <div className="px-3 pt-1 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Danh mục thẻ
          </span>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-[10px] font-semibold text-accent-clay hover:underline cursor-pointer"
            >
              Bỏ lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 px-2">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTag(activeTag === t.id ? null : t.id);
                onCloseMobile();
              }}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full transition-colors cursor-pointer border',
                activeTag === t.id
                  ? 'bg-accent-sprout text-[#103813] font-bold border-accent-sprout shadow-2xs'
                  : 'bg-canvas-subtle/80 text-text-secondary border-border/40 hover:bg-canvas-subtle hover:text-text-primary'
              )}
            >
              <Hash className="h-3 w-3 text-text-tertiary" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 5. Footer Tài Khoản Google & Trạng Thái Đồng Bộ */}
      <div className="p-3 border-t border-border-subtle bg-canvas-subtle/40 text-xs">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-7 h-7 rounded-full border border-border shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent-sprout text-[#103813] flex items-center justify-center shrink-0 font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user.displayName || 'Người dùng'}
                </p>
                <p className="text-[10px] text-text-tertiary truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-full text-text-tertiary hover:text-error hover:bg-canvas transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-surface border border-border px-3 py-2 text-xs font-semibold text-text-primary hover:bg-canvas hover:border-accent-sprout transition-all shadow-2xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-sprout shrink-0" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập Google</span>
                </>
              )}
            </button>
            {!isConfigured && (
              <p className="text-[10px] text-text-tertiary text-center leading-tight">
                Chưa cấu hình .env (Chạy chế độ Offline)
              </p>
            )}
          </div>
        )}

        {/* Thanh trạng thái phiên bản PWA */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80">
          <VersionBadge />
          <span className="text-[10px] text-text-tertiary">Elera Zen</span>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="hidden md:flex flex-col w-[260px] lg:w-[275px] shrink-0 border-r border-border h-dvh sticky top-0 z-20 bg-surface">
      {sidebarContent}
    </aside>
  );
};
