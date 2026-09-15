import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Sparkles, Edit3, Check } from 'lucide-react';

/**
 * Thẻ Bản Sắc (Identity Card)
 * Đóng vai trò ngọn hải đăng tâm lý theo Atomic Habits:
 * "Thói quen bền vững nhất xuất phát từ việc thay đổi danh tính chứ không chỉ là mục tiêu kết quả."
 */
export const IdentityCard: React.FC = () => {
  const { profile, updateProfile } = useHabits();
  const [isEditing, setIsEditing] = useState(false);
  const [draftStatement, setDraftStatement] = useState(profile.coreIdentityStatement);

  const handleSave = () => {
    if (draftStatement.trim()) {
      updateProfile({ coreIdentityStatement: draftStatement.trim() });
    }
    setIsEditing(false);
  };

  return (
    <section className="relative overflow-hidden rounded-lg bg-surface p-6 sm:p-7 border border-border shadow-[0_4px_20px_-4px_rgba(28,38,33,0.05)] transition-all duration-300 hover:border-accent-sage/60">
      {/* Hiệu ứng ánh sáng hữu cơ góc thẻ */}
      <div 
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-radial from-accent-sprout to-transparent opacity-80"
        aria-hidden="true" 
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-sprout px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Triết Lý Bản Sắc (Identity-First)</span>
          </div>

          <button
            onClick={() => {
              if (isEditing) handleSave();
              else {
                setDraftStatement(profile.coreIdentityStatement);
                setIsEditing(true);
              }
            }}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary transition-colors p-1.5 rounded-md hover:bg-canvas-subtle"
            title={isEditing ? 'Lưu bản sắc' : 'Chỉnh sửa câu tuyên ngôn'}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-semibold">Lưu</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={draftStatement}
              onChange={(e) => setDraftStatement(e.target.value)}
              className="w-full font-serif text-xl sm:text-2xl font-medium text-text-primary bg-canvas border border-border-focus rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent-sage/30 resize-none leading-relaxed"
              rows={2}
              placeholder="Tôi là người..."
              autoFocus
            />
          </div>
        ) : (
          <h1 className="font-serif text-xl sm:text-2xl lg:text-[1.65rem] font-medium text-text-primary leading-snug tracking-tight">
            "{profile.coreIdentityStatement}"
          </h1>
        )}

        <p className="mt-2.5 text-xs sm:text-sm text-text-secondary font-sans leading-relaxed">
          Mỗi thói quen nhỏ được hoàn tất là một lá phiếu bầu cho con người bạn khao khát trở thành.
        </p>
      </div>
    </section>
  );
};
