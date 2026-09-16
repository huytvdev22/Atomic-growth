import React from 'react';
import { useHabits } from '../context/HabitContext';
import { ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Thẻ Nhắc Nhở Ngữ Cảnh "Never Miss Twice" (Contextual Callout Banner)
 * Thiết kế chuẩn Elera: Banner ngang bo góc 16px, nền đất nung pastel dịu mắt, icon tròn nổi bật
 * Nguyên tắc vàng James Clear: "Bỏ lỡ một lần là điều ngẫu nhiên; bỏ lỡ hai lần là khởi đầu của thói quen xấu mới."
 */
export const NeverMissTwiceCard: React.FC = () => {
  const { hasNeverMissTwiceAlert } = useHabits();

  // Quy tắc Zen Minimalist: Chỉ hiển thị khi người dùng thực sự có thói quen bị bỏ lỡ từ hôm trước
  if (!hasNeverMissTwiceAlert) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4 sm:p-4.5 bg-semantic-terracotta-bg border border-semantic-terracotta/25 shadow-xs transition-all duration-300 animate-in fade-in">
      <div className="flex items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {/* Icon tròn trắng nổi bật */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-semantic-terracotta shadow-xs border border-semantic-terracotta/15">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-semibold text-[#3D1E16]">
                Hồi phục nhân ái (Never Miss Twice)
              </span>
              <span className="rounded-full bg-semantic-terracotta text-white text-[10px] font-sans font-bold px-2.5 py-0.5 shadow-2xs">
                Ưu tiên hôm nay
              </span>
            </div>
            <p className="text-xs text-[#6E4236] leading-relaxed">
              Hôm qua bạn đã lỡ một nhịp. Đừng tự trách mình! Hãy check-in 1 thói quen bất kỳ hôm nay để bảo vệ chuỗi sinh trưởng.
            </p>
          </div>
        </div>

        {/* Nút khích lệ dạng Pill */}
        <div className="hidden md:flex items-center shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-semantic-terracotta bg-white/80 px-3 py-1 rounded-full border border-semantic-terracotta/20 shadow-2xs">
            <Sparkles className="w-3 h-3" />
            <span>Giữ chuỗi</span>
          </span>
        </div>
      </div>
    </div>
  );
};
