import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Edit3 } from 'lucide-react';

/**
 * Thẻ Đề Tựa Bản Sắc Tinh Tế (Zen Identity Monologue)
 * Đóng vai trò ngọn hải đăng tâm lý theo Atomic Habits:
 * "Thói quen bền vững nhất xuất phát từ việc thay đổi bản sắc chứ không chỉ là mục tiêu kết quả."
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
    <div className="py-1 px-0.5">
      {isEditing ? (
        <div className="flex flex-col gap-2 bg-surface p-3.5 rounded-2xl border border-border shadow-card">
          <textarea
            value={draftStatement}
            onChange={(e) => setDraftStatement(e.target.value)}
            className="w-full font-serif italic text-base text-text-primary bg-canvas-subtle/60 border border-border-focus rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent-sprout resize-none leading-relaxed"
            rows={2}
            placeholder="Tôi là người..."
            autoFocus
          />
          <div className="flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1.5 text-text-secondary hover:text-text-primary cursor-pointer rounded-full"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-4 py-1.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-hover transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Lưu bản sắc
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex items-start justify-between gap-3">
          <p className="font-serif italic text-sm sm:text-base text-text-secondary leading-relaxed tracking-tight">
            &ldquo;{profile.coreIdentityStatement}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              setDraftStatement(profile.coreIdentityStatement);
              setIsEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-primary transition-opacity p-1.5 rounded-full hover:bg-canvas-subtle shrink-0 cursor-pointer"
            title="Chỉnh sửa câu tuyên ngôn bản sắc"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
