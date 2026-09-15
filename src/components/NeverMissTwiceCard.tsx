import React from 'react';
import { useHabits } from '../context/HabitContext';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

/**
 * Thẻ Nhắc Nhở Nhân Ái "Never Miss Twice"
 * Nguyên tắc vàng của James Clear trong Atomic Habits:
 * "Bỏ lỡ một lần là điều ngẫu nhiên trong cuộc sống. Bỏ lỡ hai lần liên tiếp là khởi đầu của một thói quen tiêu cực mới."
 */
export const NeverMissTwiceCard: React.FC = () => {
  const { hasNeverMissTwiceAlert } = useHabits();

  return (
    <div
      className={`rounded-md p-4.5 sm:p-5 border transition-all duration-300 ${
        hasNeverMissTwiceAlert
          ? 'bg-[#FDF3EE] border-accent-clay/40 shadow-xs'
          : 'bg-[#F4EFEB] border-dashed border-[#DDD4C8]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="rounded-full bg-white/80 p-2 text-accent-clay shrink-0 shadow-2xs">
          {hasNeverMissTwiceAlert ? (
            <ShieldCheck className="w-5 h-5 text-accent-clay animate-pulse" />
          ) : (
            <HeartHandshake className="w-5 h-5 text-accent-clay" />
          )}
        </div>

        <div className="space-y-1 text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
          <div className="font-semibold font-serif text-[0.95rem] text-[#332A24] flex items-center gap-2">
            <span>Quy tắc "Never Miss Twice" (Không Bỏ Lỡ 2 Lần)</span>
            {hasNeverMissTwiceAlert && (
              <span className="rounded-full bg-accent-clay text-white text-[10px] font-sans font-bold px-2 py-0.5">
                Cần phục hồi hôm nay
              </span>
            )}
          </div>
          <p>
            {hasNeverMissTwiceAlert
              ? 'Hôm qua bạn đã lỡ một vài nhịp. Đừng tự trách mình! Hãy chắc chắn hoàn tất các thói quen còn lại trong hôm nay để bảo vệ chuỗi sinh trưởng.'
              : 'Cuộc sống luôn có những ngày bận rộn bất ngờ. Nếu lỡ quên một ngày, chuỗi kiên trì của bạn vẫn được bảo vệ. Hãy tha thứ cho bản thân và quay lại ngay hôm nay.'}
          </p>
        </div>
      </div>
    </div>
  );
};
