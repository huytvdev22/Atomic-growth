import React, { useState } from 'react';
import { useHabits } from './context/HabitContext';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { QuickJotBox } from './components/QuickJotBox';
import { IdentityCard } from './components/IdentityCard';
import { RitualGroup } from './components/RitualGroup';
import { NeverMissTwiceCard } from './components/NeverMissTwiceCard';
import { ReflectionsFeed } from './components/ReflectionsFeed';
import { AddHabitModal } from './components/AddHabitModal';
import { UpdateToast } from './components/UpdateToast';
import { FlashcardsTab } from './components/anki/FlashcardsTab';
import { AnkiDecoderView } from './components/anki/AnkiDecoderView';
import { ZenSplashLoader } from './components/ZenSplashLoader';
import { ZenWelcomeScreen } from './components/ZenWelcomeScreen';
import { RitualTime } from './types/habit';
import {
  Menu,
  Search,
  Plus,
  Sparkles,
  Sprout,
  User as UserIcon
} from 'lucide-react';
import { cn } from './utils/cn';

/**
 * Ứng Dụng Chính Atomic Growth (Modern Botanical Zen v2.0.0)
 * Bố cục Khung Nổi "Floating Canvas" chuẩn mực Elera SaaS
 */
export const App: React.FC = () => {
  const {
    user,
    loading: isAuthLoading,
    isGuestMode,
    setGuestMode,
    loginWithGoogle,
    isAuthenticating,
    isConfigured
  } = useAuth();

  const {
    habits,
    toggleHabit,
    isHabitCompletedToday,
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
  const [selectedRitualFilter, setSelectedRitualFilter] = useState<'all' | RitualTime>('all');

  const handleOpenAddModal = (ritual: RitualTime = 'morning') => {
    setDefaultRitual(ritual);
    setIsAddModalOpen(true);
  };

  const morningHabits = getHabitsByRitual('morning');
  const middayHabits = getHabitsByRitual('midday');
  const eveningHabits = getHabitsByRitual('evening');

  // 1. Chờ nạp kiểm tra phiên xác thực (~300ms) để chống giật màn hình
  if (isAuthLoading) {
    return <ZenSplashLoader />;
  }

  // 2. Nếu chưa đăng nhập và chưa chọn dùng ngoại tuyến: hiển thị màn hình chào đón
  if (!user && !isGuestMode) {
    return (
      <ZenWelcomeScreen
        onLogin={loginWithGoogle}
        onContinueAsGuest={() => setGuestMode(true)}
        isAuthenticating={isAuthenticating}
        isConfigured={isConfigured}
      />
    );
  }

  return (
    <div className="min-h-dvh flex bg-canvas text-text-primary">
      {/* 1. Sidebar Trái (Desktop Cố định / Mobile Drawer) */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Khu Vực Nội Dung Chính (Main Content Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden bg-canvas">
        {/* Top Header Bar Chuẩn Elera */}
        <header className="shrink-0 bg-surface/90 backdrop-blur-md border-b border-border h-16 px-4 sm:px-6 flex items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* Nút Hamburger mở Sidebar trên Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 -ml-1.5 rounded-full text-text-secondary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
                title="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Tiêu đề trang & Breadcrumb phong cách Elera */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-sans text-base sm:text-lg font-bold tracking-tight text-text-primary">
                    {activeTab === 'timeline' && 'Dòng Thời Gian (Hôm nay)'}
                    {activeTab === 'reflections' && 'Nhật Ký Phản Tư'}
                    {activeTab === 'flashcards' && 'Góc Ôn Tập (Anki)'}
                    {activeTab === 'anki-decoder' && 'Giải Mã Anki Deck (Studio)'}
                    {activeTab === 'archive' && 'Khu Vườn Lưu Trữ'}
                  </h1>
                  {activeTag && (
                    <span className="rounded-full bg-accent-sprout/20 text-[#144919] font-bold text-[11px] px-2.5 py-0.5 border border-accent-sprout/30">
                      #{activeTag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary hidden sm:block">
                  James Clear Habits • Tích lũy 1% mỗi ngày
                </p>
              </div>
            </div>

            {/* Thanh Tìm Kiếm Pill & Nút Thêm Thói Quen */}
            <div className="flex items-center gap-2.5">
              <div className="relative hidden sm:block w-48 lg:w-64">
                <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm thói quen, bài học..."
                  className="w-full pl-9 pr-11 py-2 text-xs rounded-full border border-border/80 bg-canvas-subtle/80 focus:bg-surface focus:outline-none focus:border-accent-sprout focus:ring-1 focus:ring-accent-sprout/30 transition-all text-text-primary placeholder:text-text-tertiary"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border/60">
                  ⌘K
                </span>
              </div>

              {/* Nút CTA "+ Gieo Mầm Mới" chuẩn Elera */}
              <button
                type="button"
                onClick={() => handleOpenAddModal('morning')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#19241E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#143E2E] active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gieo Mầm Mới</span>
                <span className="sm:hidden">Thêm</span>
              </button>

              {/* User Avatar góc phải */}
              <div className="hidden sm:flex items-center ml-1">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-8 h-8 rounded-full border border-border shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent-sprout/20 text-[#144919] flex items-center justify-center font-bold text-xs border border-accent-sprout/30">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Luồng Nội Dung Thao Tác (Feed Area - Cuộn mượt mà bên trong cửa sổ) */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 pb-24">
            <div className="max-w-[760px] mx-auto space-y-6">
              {/* B. Xem Dòng Thời Gian Chính (Timeline) */}
              {activeTab === 'timeline' && (
                <div className="space-y-5">
                  {/* Dải thông báo Chế độ Khách thanh nhã */}
                  {!user && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-semantic-sky-bg border border-semantic-sky/20 text-xs text-[#1F59B3] animate-in fade-in duration-200">
                      <span className="truncate">Chế độ Khách: Dữ liệu được lưu trữ an toàn trên thiết bị này.</span>
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="font-semibold text-[#1F59B3] hover:underline shrink-0 cursor-pointer text-xs"
                      >
                        Đăng nhập Cloud
                      </button>
                    </div>
                  )}

                  {/* Câu Đề Tựa Bản Sắc Tinh Tế (Zen Identity Monologue) */}
                  <IdentityCard />

                  {/* Dải Lọc Phân Nhóm Dạng Pill (Segmented Filter Pills) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                    {[
                      { id: 'all', label: 'Tất cả', count: habits.length },
                      { id: 'morning', label: 'Rạng Đông', count: morningHabits.length },
                      { id: 'midday', label: 'Tập Trung', count: middayHabits.length },
                      { id: 'evening', label: 'Lắng Đọng', count: eveningHabits.length }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedRitualFilter(tab.id as 'all' | RitualTime)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none shrink-0',
                          selectedRitualFilter === tab.id
                            ? 'bg-[#19241E] text-white border-[#19241E] shadow-2xs'
                            : 'bg-surface text-text-secondary border-border/80 hover:bg-canvas-subtle hover:text-text-primary'
                        )}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                            selectedRitualFilter === tab.id
                              ? 'bg-white/20 text-white'
                              : 'bg-canvas-subtle text-text-tertiary'
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Thông Báo Bối Cảnh Never Miss Twice Chuẩn Elera */}
                  <NeverMissTwiceCard />

                  {/* Danh sách Thói quen hoặc Clean Empty State */}
                  {totalActiveHabits === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12 text-center space-y-4 shadow-card">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-semantic-green-bg text-accent-sprout mx-auto border border-accent-sprout/30">
                        <Sprout className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-text-primary">
                          Khu vườn thói quen đang đón chào bạn
                        </h3>
                        <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                          Bắt đầu bằng một hành động nhỏ chỉ mất 2 phút. Tích lũy 1% mỗi ngày để kiến tạo bản sắc kiên định.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('morning')}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#19241E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Gieo hạt mầm đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-1">
                      {(selectedRitualFilter === 'all' || selectedRitualFilter === 'morning') && (
                        <RitualGroup
                          ritual="morning"
                          habits={morningHabits}
                          onAddHabitClick={handleOpenAddModal}
                        />
                      )}

                      {(selectedRitualFilter === 'all' || selectedRitualFilter === 'midday') && (
                        <RitualGroup
                          ritual="midday"
                          habits={middayHabits}
                          onAddHabitClick={handleOpenAddModal}
                        />
                      )}

                      {(selectedRitualFilter === 'all' || selectedRitualFilter === 'evening') && (
                        <RitualGroup
                          ritual="evening"
                          habits={eveningHabits}
                          onAddHabitClick={handleOpenAddModal}
                        />
                      )}
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

              {/* D. Xem Góc Ôn Tập Thẻ Nhớ (Flashcards) */}
              {activeTab === 'flashcards' && (
                <FlashcardsTab
                  onSessionCompleted={() => {
                    const flashcardHabit = habits.find(
                      (h) =>
                        h.title.toLowerCase().includes('thẻ') ||
                        h.title.toLowerCase().includes('anki') ||
                        h.title.toLowerCase().includes('từ vựng')
                    );
                    if (flashcardHabit && !isHabitCompletedToday(flashcardHabit.id)) {
                      toggleHabit(flashcardHabit.id);
                    }
                  }}
                />
              )}

              {/* E. Xem Giải Mã & Chẩn Đoán Anki Deck (Decoder Studio) */}
              {activeTab === 'anki-decoder' && (
                <AnkiDecoderView
                  onImportCompleted={() => {
                    setActiveTab('flashcards');
                  }}
                />
              )}

              {/* F. Xem Lưu Trữ (Archive) */}
              {activeTab === 'archive' && (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-card">
                  <Sprout className="w-10 h-10 text-accent-sage mx-auto mb-3 opacity-60" />
                  <h3 className="font-serif text-lg font-semibold text-text-primary">
                    Khu Vườn Lưu Trữ
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Những thói quen và mục tiêu đã hoàn thành xuất sắc sẽ được lưu giữ tại đây.
                  </p>
                </div>
              )}

              {/* Footer Phong Cách Botanical Zen */}
              <footer className="pt-8 pb-4 text-center border-t border-border-subtle text-xs text-text-secondary space-y-2">
                <p className="font-serif italic text-sm text-text-primary">
                  &ldquo;Bạn không nâng tầm bản thân lên mức kỳ vọng; bạn rơi xuống mức của các thói quen bạn duy trì.&rdquo;
                </p>
                <p className="flex items-center justify-center gap-1 text-[11px] text-text-tertiary">
                  <Sparkles className="w-3 h-3 text-accent-sprout inline" />
                  <span>Atomic Habits James Clear • Thiết kế Modern Botanical Zen</span>
                </p>
              </footer>
            </div>
          </main>

          {/* Floating Action Button trên Mobile - Chỉ hiển thị tại Timeline */}
          {activeTab === 'timeline' && (
            <button
              type="button"
              onClick={() => handleOpenAddModal('morning')}
              aria-label="Thêm thói quen mới"
              className="fixed bottom-6 right-6 md:hidden z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#19241E] text-white shadow-xl hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

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
