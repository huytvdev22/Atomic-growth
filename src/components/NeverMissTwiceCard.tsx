import React from 'react';
import { useHabits } from '../context/HabitContext';
import { ShieldCheck } from 'lucide-react';

/**
 * Thẻ Nhắc Nhở Nhân Ái "Never Miss Twice"
 * Nguyên tắc vàng của James Clear trong Atomic Habits:
 * "Bỏ lỡ một lần là điều ngẫu nhiên trong cuộc sống. Bỏ lỡ hai lần liên tiếp là khởi đầu của một thói quen tiêu cực mới."
 */
export const NeverMissTwiceCard: React.FC = () => {
  const { hasNeverMissTwiceAlert } = useHabits();

  // Quy tắc Zen Minimalism: Chỉ hiển thị khi người dùng thực sự cần hồi phục thói quen bị lỡ
  if (!hasNeverMissTwiceAlert) {
    return null;
  }

  return (
    <div className="rounded-lg p-3.5 sm:p-4 bg-[#FDF3EE] border border-accent-clay/30 shadow-2xs transition-all duration-300 animate-in fade-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white/90 p-1.5 text-accent-clay shrink-0 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-accent-clay" />
        </div>

        <div className="space-y-0.5 text-xs text-[#4A3E38] leading-relaxed flex-1">
          <div className="font-semibold font-serif text-sm text-[#332A24] flex items-center gap-2">
            <span>Hồi phục nhân ái (Never Miss Twice)</span>
            <span className="rounded-full bg-accent-clay text-white text-[10px] font-sans font-bold px-2 py-0.2">
              Hôm nay
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#6A5A52]">
            Hôm qua bạn đã lỡ một nhịp. Đừng tự trách mình! Hãy check-in các thói quen hôm nay để bảo vệ chuỗi sinh trưởng.
          </p>
        </div>
      </div>
    </div>
  );
};
