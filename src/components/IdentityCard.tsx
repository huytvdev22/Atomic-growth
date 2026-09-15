import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Edit3 } from 'lucide-react';

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
    <div className="py-2 px-1">
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftStatement}
            onChange={(e) => setDraftStatement(e.target.value)}
            className="w-full font-serif italic text-base sm:text-lg text-text-primary bg-surface border border-border-focus rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-accent-sage resize-none leading-relaxed"
            rows={2}
            placeholder="Tôi là người..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs px-2.5 py-1 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-3 py-1 rounded bg-primary text-white font-medium hover:bg-primary-hover transition-colors cursor-pointer"
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
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-primary transition-opacity p-1 rounded hover:bg-canvas-subtle shrink-0"
            title="Chỉnh sửa câu tuyên ngôn bản sắc"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
