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
  Trash2,
  Sunrise,
  Compass,
  Moon,
  Hash,
  X,
  LogOut,
  Cloud,
  CloudOff,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
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

  const { user, loginWithGoogle, logout, isConfigured } = useAuth();

  // Sinh 28 ô vuông (4 tuần) cho mini heatmap trong sidebar
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
    <div className="flex flex-col h-full bg-surface text-text-primary">
      {/* 1. Header Logo & Cài Đặt */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary shadow-2xs">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-sm font-bold tracking-tight text-primary">
              Atomic Growth
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              {isCloudSynced ? (
                <>
                  <Cloud className="h-3 w-3 text-accent-sage" />
                  <span className="text-accent-sage font-medium">Đồng bộ Cloud</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3 text-text-tertiary" />
                  <span>Offline / Local</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
            title="Cài đặt"
          >
            <Settings className="h-4 w-4" />
          </button>
          {/* Nút đóng trên mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden rounded-md p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Bộ 3 Chỉ Số Lớn (Top Counters) */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3.5 border-b border-border-subtle text-center">
        <div className="flex flex-col">
          <span className="font-mono text-xl font-bold text-text-primary">
            {habits.length}
          </span>
          <span className="text-[11px] text-text-tertiary">Thói quen</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xl font-bold text-accent-amber">
            {topStreak}d
          </span>
          <span className="text-[11px] text-text-tertiary">Kỷ lục</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xl font-bold text-primary">
            {completionRate}%
          </span>
          <span className="text-[11px] text-text-tertiary">Hôm nay</span>
        </div>
      </div>

      {/* 3. Mini Garden Heatmap (Lưới ô vuông khu vườn) */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary mb-2">
          <span>Khu vườn kiên trì</span>
          <span className="font-mono text-accent-sage">4 tuần qua</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {miniHeatmapCells.map((cell, i) => {
            const levelClass = {
              0: 'bg-canvas-subtle',
              1: 'bg-[#D2E7DC]',
              2: 'bg-[#96CBB0]',
              3: 'bg-[#528B70]',
              4: 'bg-primary'
            }[cell.level];

            return (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded-xs transition-transform duration-100 hover:scale-125 cursor-pointer',
                  levelClass,
                  cell.isToday && 'ring-1.5 ring-accent-amber'
                )}
                title={`${cell.date}: Hoàn thành ${cell.completedCount} thói quen`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-text-tertiary mt-1.5">
          <span>Tháng trước</span>
          <span>Tuần này</span>
        </div>
      </div>

      {/* 4. Menu Điều Hướng Chính */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('timeline');
            setActiveTag(null);
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer',
            activeTab === 'timeline' && activeTag === null
              ? 'bg-accent-sprout/60 text-primary border-l-[3px] border-primary font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4" />
            <span>Dòng thời gian (Hôm nay)</span>
          </div>
          <span className="font-mono text-[11px] bg-white/80 text-text-secondary px-2 py-0.2 rounded-full border border-border">
            {habits.length}
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
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer',
            activeTab === 'reflections'
              ? 'bg-accent-sprout/60 text-primary border-l-[3px] border-primary font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4" />
            <span>Nhật ký Phản tư</span>
          </div>
          <span className="font-mono text-[11px] bg-white/80 text-text-secondary px-2 py-0.2 rounded-full border border-border">
            {notes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('archive');
            onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer',
            activeTab === 'archive'
              ? 'bg-accent-sprout/60 text-primary border-l-[3px] border-primary font-bold shadow-2xs'
              : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Archive className="h-4 w-4" />
            <span>Lưu trữ</span>
          </div>
          <span className="font-mono text-[11px] text-text-tertiary">0</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md text-text-tertiary hover:bg-canvas-subtle hover:text-text-secondary transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="h-4 w-4" />
            <span>Thùng rác</span>
          </div>
          <span className="font-mono text-[11px] text-text-tertiary">0</span>
        </button>

        {/* Phân cách */}
        <div className="pt-3 pb-1 px-3">
          <div className="h-px bg-border-subtle" />
        </div>

        {/* Khối Nhịp Sinh Học */}
        <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
          Nhịp sinh học
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary">
            <Sunrise className="h-4 w-4 text-accent-amber" />
            <span>Rạng Đông</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary">
            <Compass className="h-4 w-4 text-accent-sage" />
            <span>Tập Trung</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary">
            <Moon className="h-4 w-4 text-primary" />
            <span>Lắng Đọng</span>
          </div>
        </div>

        {/* Phân cách Tags */}
        <div className="pt-3 pb-1 px-3">
          <div className="h-px bg-border-subtle" />
        </div>

        {/* Danh Mục (Tags) */}
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

        <div className="space-y-0.5">
          {tags.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTag(activeTag === t.id ? null : t.id);
                onCloseMobile();
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer',
                activeTag === t.id
                  ? 'bg-accent-sprout font-bold text-primary'
                  : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
              )}
            >
              <Hash className="h-3.5 w-3.5 text-text-tertiary" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 5. Footer Tài Khoản Google & Trạng Thái Đồng Bộ */}
      <div className="p-3 border-t border-border-subtle bg-canvas-subtle/50 text-xs">
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
                <div className="w-7 h-7 rounded-full bg-accent-sprout text-primary flex items-center justify-center shrink-0 font-bold text-xs">
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
              className="p-1.5 rounded-md text-text-tertiary hover:text-error hover:bg-canvas transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-surface border border-border px-3 py-2 text-xs font-semibold text-text-primary hover:bg-canvas hover:border-accent-sage transition-all shadow-2xs cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
            </button>
            {!isConfigured && (
              <p className="text-[10px] text-text-tertiary text-center leading-tight">
                Chưa cấu hình .env (Chạy chế độ Offline)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Bản Desktop: Sidebar Cố định bên trái */}
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 border-r border-border h-dvh sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* 2. Bản Mobile: Off-canvas Drawer trượt từ bên trái ra (Ảnh 2) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Lớp phủ Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Khung Drawer */}
          <div className="relative z-10 w-[290px] h-full shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
