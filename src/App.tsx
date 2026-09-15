import React, { useState } from 'react';
import { useHabits } from './context/HabitContext';
import { Sidebar } from './components/Sidebar';
import { QuickJotBox } from './components/QuickJotBox';
import { IdentityCard } from './components/IdentityCard';
import { RitualGroup } from './components/RitualGroup';
import { NeverMissTwiceCard } from './components/NeverMissTwiceCard';
import { ReflectionsFeed } from './components/ReflectionsFeed';
import { AddHabitModal } from './components/AddHabitModal';
import { UpdateToast } from './components/UpdateToast';
import { RitualTime } from './types/habit';
import { Menu, Search, Plus, Sparkles, Heart, Sprout, Calendar, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const {
    getHabitsByRitual,
    totalActiveHabits,
    activeTab,
    setActiveTab,
    activeTag,
    searchQuery,
    setSearchQuery
  } = useHabits();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [defaultRitual, setDefaultRitual] = useState<RitualTime>('morning');

  const handleOpenAddModal = (ritual: RitualTime = 'morning') => {
    setDefaultRitual(ritual);
    setIsAddModalOpen(true);
  };

  const morningHabits = getHabitsByRitual('morning');
  const middayHabits = getHabitsByRitual('midday');
  const eveningHabits = getHabitsByRitual('evening');

  return (
    <div className="min-h-dvh flex bg-canvas text-text-primary">
      {/* 1. Sidebar Trái (Desktop Cố định / Mobile Drawer - FlareMo Style) */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Khu Vực Nội Dung Chính (Main Feed Stream) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Nút Hamburger mở Sidebar trên Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-md text-text-secondary hover:bg-canvas-subtle hover:text-text-primary"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb vị trí (như / Timeline trong ảnh) */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-secondary truncate">
              <span className="text-text-tertiary">/</span>
              <button
                onClick={() => setActiveTab('timeline')}
                className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-text-primary"
              >
                {activeTab === 'timeline' && <Calendar className="w-3.5 h-3.5" />}
                {activeTab === 'reflections' && <BookOpen className="w-3.5 h-3.5" />}
                <span>
                  {activeTab === 'timeline' && 'Timeline'}
                  {activeTab === 'reflections' && 'Nhật ký Phản tư'}
                  {activeTab === 'archive' && 'Lưu trữ'}
                </span>
              </button>
              {activeTag && (
                <>
                  <span className="text-text-tertiary">/</span>
                  <span className="text-primary font-bold">#{activeTag}</span>
                </>
              )}
            </div>
          </div>

          {/* Ô Tìm Kiếm & Nút Gieo Mầm */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thói quen, bài học..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-border bg-canvas focus:bg-surface focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-accent-sage/30 transition-all text-text-primary placeholder:text-text-tertiary"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal('morning')}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gieo Mầm Mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </header>

        {/* Luồng Nội Dung Thao Tác (Feed Area - Tối đa 680px theo chuẩn Zen Minimalist) */}
        <main className="flex-1 max-w-[680px] w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
          {/* B. Xem Dòng Thời Gian Chính (Timeline) */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              {/* Câu Đề Tựa Bản Sắc Tinh Tế (Zen Identity Header) */}
              <IdentityCard />

              {/* Thông Báo Bối Cảnh Never Miss Twice (Chỉ hiện khi có nguy cơ đứt chuỗi) */}
              <NeverMissTwiceCard />

              {/* Danh sách Thói quen hoặc Clean Empty State */}
              {totalActiveHabits === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 sm:p-10 text-center space-y-3 shadow-2xs">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-sprout text-primary mx-auto">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-text-primary">
                      Khu vườn thói quen đang chờ đón bạn
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                      Bắt đầu bằng một hành động nhỏ chỉ mất 2 phút. Tích lũy 1% mỗi ngày để kiến tạo bản sắc kiên định.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal('morning')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gieo hạt mầm đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-1">
                  <RitualGroup
                    ritual="morning"
                    habits={morningHabits}
                    onAddHabitClick={handleOpenAddModal}
                  />

                  <RitualGroup
                    ritual="midday"
                    habits={middayHabits}
                    onAddHabitClick={handleOpenAddModal}
                  />

                  <RitualGroup
                    ritual="evening"
                    habits={eveningHabits}
                    onAddHabitClick={handleOpenAddModal}
                  />
                </div>
              )}
            </div>
          )}

          {/* C. Xem Toàn Bộ Nhật Ký Phản Tư (Reflections Feed View) */}
          {activeTab === 'reflections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text-primary">
                    Kho Tàng Phản Tư & Bài Học
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Lưu giữ những chuyển hóa nhận thức nhỏ mỗi ngày
                  </p>
                </div>
              </div>
              <QuickJotBox />
              <ReflectionsFeed />
            </div>
          )}

          {/* D. Xem Lưu Trữ (Archive) */}
          {activeTab === 'archive' && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
              <Sprout className="w-10 h-10 text-accent-sage mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Khu Vườn Lưu Trữ
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Những thói quen và mục tiêu đã hoàn thành xuất sắc sẽ được lưu giữ tại đây.
              </p>
            </div>
          )}

          {/* Footer Phong cách Botanical Zen */}
          <footer className="pt-8 pb-4 text-center border-t border-border-subtle text-xs text-text-secondary space-y-2">
            <p className="font-serif italic text-sm text-text-primary">
              "Bạn không nâng tầm bản thân lên mức kỳ vọng; bạn rơi xuống mức của các thói quen bạn duy trì."
            </p>
            <p className="flex items-center justify-center gap-1 text-[11px] text-text-tertiary">
              <Sparkles className="w-3 h-3 text-primary inline" />
              <span>Phương pháp James Clear • Kiến trúc Flomo Minimalist •</span>
              <Heart className="w-3 h-3 text-accent-clay inline fill-accent-clay" />
              <span>Botanical Zen</span>
            </p>
          </footer>
        </main>

        {/* Floating Action Button trên Mobile */}
        <button
          type="button"
          onClick={() => handleOpenAddModal('morning')}
          aria-label="Thêm thói quen mới"
          className="fixed bottom-6 right-6 sm:hidden z-30 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Modal Thêm Thói Quen (BottomSheet) */}
        <AddHabitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultRitual={defaultRitual}
        />

        {/* Thông báo cập nhật phiên bản mới (PWA Update Toast) */}
        <UpdateToast />
      </div>
    </div>
  );
};
