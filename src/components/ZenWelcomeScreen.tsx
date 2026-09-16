import React from 'react';
import {
  Sprout,
  Compass,
  Zap,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ZenWelcomeScreenProps {
  onLogin: () => void;
  onContinueAsGuest: () => void;
  isAuthenticating: boolean;
  isConfigured: boolean;
}

/**
 * ZenWelcomeScreen - Màn hình chào đón & định hướng khi người dùng chưa đăng nhập
 * Thực thi theo Phương án 1 (Zen Onboarding Hero) tuân thủ nghiêm ngặt DESIGN.md:
 * - Phong cách Botanical Zen Minimalist (Alabaster Linen #F8F7F2, Newsreader Serif, Deep Cypress Ink)
 * - Tập trung tối đa vào triết lý Atomic Habits của James Clear
 * - Cung cấp 2 lựa chọn minh bạch: Đăng nhập Google (Đồng bộ Cloud) hoặc Dùng thử ngoại tuyến (Khách)
 */
export const ZenWelcomeScreen: React.FC<ZenWelcomeScreenProps> = ({
  onLogin,
  onContinueAsGuest,
  isAuthenticating,
  isConfigured
}) => {
  return (
    <div className="min-h-dvh flex flex-col justify-between bg-canvas text-text-primary px-4 py-8 sm:py-12 select-none">
      {/* Container chính giới hạn 620px theo chuẩn khoảng thở Zen */}
      <main className="max-w-[620px] w-full mx-auto my-auto space-y-8 animate-in fade-in duration-300">
        {/* 1. Header Thương Hiệu & Câu Châm Ngôn James Clear */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-sprout text-primary shadow-xs mb-1">
            <Sprout className="w-6 h-6" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
            Kiến tạo bản sắc kiên định <br className="hidden sm:inline" />
            <span className="text-primary">từ 1% mỗi ngày</span>
          </h1>

          <p className="font-serif italic text-sm sm:text-base text-text-secondary max-w-md mx-auto leading-relaxed">
            &ldquo;Mỗi hành động nhỏ bạn thực hiện hôm nay là một lá phiếu bầu cho con người bạn khao khát trở thành.&rdquo;
          </p>
        </div>

        {/* 2. Bộ Ba Trụ Cột Phương Pháp Luận (3 Zen Pillars) */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Bản Sắc Cốt Lõi
            </h2>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Tập trung vào câu hỏi &ldquo;Tôi là ai&rdquo; thay vì bảng đếm số vô hồn.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Quy Tắc 2 Phút
            </h2>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Bắt đầu với phiên bản siêu nhỏ để triệt tiêu mọi ma sát trì hoãn.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Never Miss Twice
            </h2>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Không xóa chuỗi khi lỡ 1 ngày. Cơ chế hồi phục nhân ái bền vững.
            </p>
          </div>
        </div>

        {/* 3. Khối Thao Tác Bắt Đầu (Call to Actions) */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-base font-bold text-text-primary">
              Bắt đầu hành trình của bạn
            </h3>
            <p className="text-xs text-text-secondary">
              Lựa chọn phương thức bạn muốn trải nghiệm Atomic Growth hôm nay:
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Nút 1: Đăng nhập Google (Khuyến nghị để đồng bộ Cloud) */}
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <div className="bg-white p-1 rounded-full shrink-0">
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
                  </div>
                  <span>Đăng nhập với Google (Đồng bộ đa thiết bị)</span>
                </>
              )}
            </button>

            {/* Nút 2: Trải nghiệm ngoại tuyến (Chế độ Khách) */}
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-canvas border border-border px-4 py-2.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-canvas-subtle hover:border-accent-sage/40 transition-all cursor-pointer"
            >
              <span>Trải nghiệm ngoại tuyến (Chế độ Khách)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-text-tertiary text-center pt-1 leading-normal">
            Chế độ khách lưu an toàn trên máy này. Bạn có thể đăng nhập bất kỳ lúc nào để đồng bộ đám mây.
          </p>

          {!isConfigured && (
            <div className="rounded-lg bg-accent-sprout/50 border border-border-subtle p-2.5 text-center text-[11px] text-text-secondary">
              Chưa cấu hình API Key trong tệp <code className="font-mono text-primary font-bold">.env</code>. Bạn có thể dùng chế độ ngoại tuyến ngay bây giờ.
            </div>
          )}
        </div>
      </main>

      {/* Footer mộc mạc phong cách Botanical Zen */}
      <footer className="max-w-[620px] w-full mx-auto text-center pt-6 text-xs text-text-tertiary space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-[11px]">
          <Sparkles className="w-3 h-3 text-accent-sage inline" />
          <span>Phương pháp James Clear • Kiến trúc Flomo Minimalist • Botanical Zen</span>
        </p>
      </footer>
    </div>
  );
};
