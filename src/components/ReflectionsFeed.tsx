import React from 'react';
import { useHabits } from '../context/HabitContext';
import { Hash, Sunrise, Compass, Moon, Trash2, BookOpen } from 'lucide-react';

export const ReflectionsFeed: React.FC = () => {
  const { notes, deleteNote, activeTag, searchQuery } = useHabits();

  const filteredNotes = notes
    .filter(n => (activeTag ? n.tag === activeTag : true))
    .filter(n => (searchQuery ? n.content.toLowerCase().includes(searchQuery.toLowerCase()) : true));

  const ritualIcons = {
    morning: <Sunrise className="w-3.5 h-3.5 text-accent-amber" />,
    midday: <Compass className="w-3.5 h-3.5 text-accent-sage" />,
    evening: <Moon className="w-3.5 h-3.5 text-primary" />
  };

  const tagLabels: Record<string, string> = {
    health: 'Sức-khỏe',
    mind: 'Tâm-trí',
    focus: 'Trí-tuệ',
    gratitude: 'Biết-ơn'
  };

  if (filteredNotes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
        <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium text-text-secondary">
          Chưa có ghi chép phản tư nào phù hợp.
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          Hãy viết một dòng suy ngẫm đầu tiên ở khung phía trên!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span className="font-semibold font-serif text-sm text-text-primary">
          Dòng thời gian phản tư ({filteredNotes.length})
        </span>
      </div>

      <div className="space-y-2.5">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="group relative rounded-md bg-surface p-4 border border-border hover:border-accent-sage/60 transition-all shadow-[0_2px_10px_-4px_rgba(28,38,33,0.03)]"
          >
            <p className="font-sans text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border-subtle text-xs text-text-tertiary">
              <div className="flex items-center gap-2.5">
                {note.ritual && (
                  <span className="inline-flex items-center gap-1" title={`Thời điểm: ${note.ritual}`}>
                    {ritualIcons[note.ritual]}
                  </span>
                )}
                {note.tag && (
                  <span className="inline-flex items-center gap-0.5 text-primary font-medium text-[11px] bg-accent-sprout px-2 py-0.5 rounded-full">
                    <Hash className="w-3 h-3" />
                    <span>{tagLabels[note.tag] || note.tag}</span>
                  </span>
                )}
                <span className="text-[11px]">{note.date}</span>
              </div>

              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-error transition-all"
                title="Xóa ghi chép"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
