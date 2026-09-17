import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Habit, HabitLog, UserProfile, RitualTime, MicroNote } from '../types/habit';
import { habitStorage } from '../services/habitStorage';
import { getTodayString, evaluateStreakOnCheckIn, calculateEffectiveHabitStreak } from '../utils/habitCalculations';
import { playZenTapSound, triggerCelebrationConfetti } from '../utils/soundEffects';
import { useAuth } from './AuthContext';
import { indexedDbService } from '../services/indexedDbService';
import {
  subscribeToHabits,
  subscribeToLogs,
  subscribeToNotes,
  subscribeToProfile,
  syncHabit,
  removeHabit,
  syncLog,
  removeLog,
  syncNote,
  removeNote,
  syncProfile,
  seedUserDataIfEmpty
} from '../services/firestoreSync';

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  notes: MicroNote[];
  profile: UserProfile;
  todayDate: string;
  isHabitCompletedToday: (habitId: string) => boolean;
  toggleHabit: (habitId: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'order' | 'createdAt'>) => void;
  deleteHabit: (habitId: string) => void;
  addNote: (content: string, tag?: string, ritual?: RitualTime) => void;
  deleteNote: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completedTodayCount: number;
  totalActiveHabits: number;
  completionRate: number;
  topStreak: number;
  hasNeverMissTwiceAlert: boolean;
  getHabitsByRitual: (ritual: RitualTime) => Habit[];
  activeTab: 'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard';
  setActiveTab: (tab: 'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard') => void;
  flashcardsResetKey: number;
  resetFlashcardsToList: () => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudSynced: boolean;
  // Điều phối mở phiên ôn tập bộ thẻ từ bất cứ đâu
  activeReviewDeckId: string | null;
  startDeckReview: (deckId: string) => void;
  clearDeckReview: () => void;
  // Hoàn thành thói quen khi kết thúc phiên ôn của một bộ thẻ
  completeHabitByDeckId: (deckId: string) => void;
}

const HabitContext = createContext<HabitContextType | null>(null);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Khởi tạo state: Luôn thanh lọc dữ liệu demo cũ và ưu tiên trạng thái sạch
  const [habits, setHabits] = useState<Habit[]>(() => {
    habitStorage.cleanLegacyDemoData();
    return user ? [] : habitStorage.getHabits();
  });
  const [logs, setLogs] = useState<HabitLog[]>(() => {
    return user ? [] : habitStorage.getLogs();
  });
  const [notes, setNotes] = useState<MicroNote[]>(() => {
    return user ? [] : habitStorage.getNotes();
  });
  const [profile, setProfile] = useState<UserProfile>(() => habitStorage.getProfile());
  const [activeTab, setActiveTabState] = useState<'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard'>('timeline');
  const [flashcardsResetKey, setFlashcardsResetKey] = useState<number>(0);

  const resetFlashcardsToList = useCallback(() => {
    setFlashcardsResetKey((k) => k + 1);
  }, []);

  const setActiveTab = useCallback((tab: 'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard') => {
    if (tab === 'flashcards') {
      setFlashcardsResetKey((k) => k + 1);
    }
    setActiveTabState(tab);
  }, []);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReviewDeckId, setActiveReviewDeckId] = useState<string | null>(null);

  const startDeckReview = useCallback((deckId: string) => {
    setActiveReviewDeckId(deckId);
    setActiveTabState('flashcards');
  }, []);

  const clearDeckReview = useCallback(() => {
    setActiveReviewDeckId(null);
  }, []);

  const todayDate = useMemo(() => getTodayString(), []);
  const isCloudSynced = Boolean(user);

  // Khi người dùng đăng nhập bằng Google: Lắng nghe và đồng bộ dữ liệu Real-time với Cloud Firestore
  useEffect(() => {
    // 1. Luôn loại bỏ dữ liệu demo cũ khỏi LocalStorage
    habitStorage.cleanLegacyDemoData();

    if (!user) {
      // Khi chưa đăng nhập: Tải dữ liệu sạch cục bộ từ LocalStorage
      setHabits(habitStorage.getHabits());
      setLogs(habitStorage.getLogs());
      setNotes(habitStorage.getNotes());
      setProfile(habitStorage.getProfile());
      return;
    }

    // Khi đã đăng nhập Google:
    // Reset state về mảng rỗng ngay lập tức để không lưu giữ hoặc chớp thói quen từ LocalStorage
    setHabits([]);
    setLogs([]);
    setNotes([]);

    const userId = user.uid;

    // Khởi tạo hồ sơ người dùng sạch trên Cloud nếu là lần đầu đăng nhập (Clean Slate)
    seedUserDataIfEmpty(userId, user.displayName || undefined);

    // Lắng nghe danh sách thói quen thực từ Cloud
    const unsubHabits = subscribeToHabits(
      userId,
      (cloudHabits) => {
        // Luôn cập nhật trực tiếp danh sách từ Cloud (kể cả mảng rỗng cho tài khoản mới)
        setHabits(cloudHabits);
      },
      (err) => {
        console.warn('[HabitContext] Lỗi khi đồng bộ Firestore habits, giữ Clean Slate:', err);
        setHabits([]);
      }
    );

    // Lắng nghe lịch sử check-in thực từ Cloud
    const unsubLogs = subscribeToLogs(
      userId,
      (cloudLogs) => {
        setLogs(cloudLogs);
      },
      (err) => {
        console.warn('[HabitContext] Lỗi khi đồng bộ Firestore logs:', err);
        setLogs([]);
      }
    );

    // Lắng nghe ghi chép phản tư thực từ Cloud
    const unsubNotes = subscribeToNotes(
      userId,
      (cloudNotes) => {
        setNotes(cloudNotes);
      },
      (err) => {
        console.warn('[HabitContext] Lỗi khi đồng bộ Firestore notes:', err);
        setNotes([]);
      }
    );

    // Lắng nghe hồ sơ người dùng thực từ Cloud
    const unsubProfile = subscribeToProfile(userId, (cloudProfile) => {
      setProfile(cloudProfile);
    });

    return () => {
      unsubHabits?.();
      unsubLogs?.();
      unsubNotes?.();
      unsubProfile?.();
    };
  }, [user]);

  // Luôn lưu dự phòng xuống LocalStorage để ứng dụng mở tức thì kể cả khi mất mạng
  useEffect(() => {
    if (!user) {
      habitStorage.saveHabits(habits);
    }
  }, [habits, user]);

  useEffect(() => {
    if (!user) {
      habitStorage.saveLogs(logs);
    }
  }, [logs, user]);

  useEffect(() => {
    if (!user) {
      habitStorage.saveNotes(notes);
    }
  }, [notes, user]);

  useEffect(() => {
    if (!user) {
      habitStorage.saveProfile(profile);
    }
  }, [profile, user]);

  const isHabitCompletedToday = useCallback(
    (habitId: string): boolean => {
      return logs.some(log => log.habitId === habitId && log.date === todayDate && log.completed);
    },
    [logs, todayDate]
  );

  const completedTodayCount = useMemo(() => {
    return habits.filter(h => isHabitCompletedToday(h.id)).length;
  }, [habits, isHabitCompletedToday]);

  const totalActiveHabits = habits.length;

  const completionRate = useMemo(() => {
    if (totalActiveHabits === 0) return 0;
    return Math.round((completedTodayCount / totalActiveHabits) * 100);
  }, [completedTodayCount, totalActiveHabits]);

  const topStreak = useMemo(() => {
    return habits.reduce(
      (max, h) => Math.max(max, calculateEffectiveHabitStreak(h, todayDate)),
      0
    );
  }, [habits, todayDate]);

  const hasNeverMissTwiceAlert = useMemo(() => {
    return habits.some(h => h.inGracePeriod && !isHabitCompletedToday(h.id));
  }, [habits, isHabitCompletedToday]);

  const toggleHabit = useCallback(
    async (habitId: string) => {
      const isCurrentlyCompleted = isHabitCompletedToday(habitId);
      const now = Date.now();
      const targetHabit = habits.find(h => h.id === habitId);
      if (!targetHabit) return;

      if (!isCurrentlyCompleted) {
        // Hoàn thành
        const newLog: HabitLog = {
          id: `log-${todayDate}-${habitId}-${now}`,
          habitId,
          date: todayDate,
          completed: true,
          timestamp: now
        };

        const { newStreak, inGracePeriod } = evaluateStreakOnCheckIn(
          targetHabit.lastCompletedDate,
          targetHabit.currentStreak,
          todayDate
        );

        const updatedHabit: Habit = {
          ...targetHabit,
          currentStreak: newStreak,
          bestStreak: Math.max(targetHabit.bestStreak, newStreak),
          lastCompletedDate: todayDate,
          inGracePeriod
        };

        // Cập nhật State cục bộ
        setLogs(prev => [...prev.filter(l => !(l.habitId === habitId && l.date === todayDate)), newLog]);
        setHabits(prev => prev.map(h => (h.id === habitId ? updatedHabit : h)));

        // Nếu đã đăng nhập -> Lưu lên Firestore
        if (user) {
          syncLog(user.uid, newLog);
          syncHabit(user.uid, updatedHabit);
        }

        if (profile.soundEnabled) {
          playZenTapSound();
        }
        if (completedTodayCount + 1 >= totalActiveHabits) {
          triggerCelebrationConfetti();
        }
      } else {
        // Hủy hoàn thành
        const logToRemove = logs.find(l => l.habitId === habitId && l.date === todayDate);
        const updatedHabit: Habit = {
          ...targetHabit,
          currentStreak: Math.max(0, targetHabit.currentStreak - 1)
        };

        setLogs(prev => prev.filter(l => !(l.habitId === habitId && l.date === todayDate)));
        setHabits(prev => prev.map(h => (h.id === habitId ? updatedHabit : h)));

        if (user) {
          if (logToRemove) {
            removeLog(user.uid, logToRemove.id);
          }
          syncHabit(user.uid, updatedHabit);
        }
      }
    },
    [isHabitCompletedToday, todayDate, habits, logs, user, profile.soundEnabled, completedTodayCount, totalActiveHabits]
  );

  const addHabit = useCallback(
    async (newHabitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'order' | 'createdAt'>) => {
      const newId = `habit-${Date.now()}`;
      const newHabit: Habit = {
        ...newHabitData,
        id: newId,
        currentStreak: 0,
        bestStreak: 0,
        order: habits.length + 1,
        createdAt: new Date().toISOString()
      };

      setHabits(prev => [...prev, newHabit]);

      // Nếu có liên kết bộ thẻ -> Cập nhật 2 chiều vào IndexedDB
      if (newHabit.linkedDeckId) {
        indexedDbService.updateDeckLinkedHabit(newHabit.linkedDeckId, newId).catch(err => {
          console.warn('Không thể cập nhật liên kết bộ thẻ trong IndexedDB:', err);
        });
      }

      if (user) {
        await syncHabit(user.uid, newHabit);
      }
    },
    [habits.length, user]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      const habitToDelete = habits.find(h => h.id === habitId);
      if (habitToDelete?.linkedDeckId) {
        indexedDbService.unlinkDeckHabit(habitId).catch(err => {
          console.warn('Không thể gỡ liên kết bộ thẻ trong IndexedDB:', err);
        });
      }

      setHabits(prev => prev.filter(h => h.id !== habitId));
      setLogs(prev => prev.filter(l => l.habitId !== habitId));

      if (user) {
        await removeHabit(user.uid, habitId);
      }
    },
    [habits, user]
  );

  const completeHabitByDeckId = useCallback(
    (deckId: string) => {
      // 1. Tìm thói quen có liên kết chính xác với bộ thẻ này
      const linkedHabit = habits.find((h) => h.linkedDeckId === deckId);
      if (linkedHabit) {
        // Kiểm tra cờ autoCheckInOnReview (mặc định bật trừ khi explicit false)
        if (linkedHabit.autoCheckInOnReview !== false && !isHabitCompletedToday(linkedHabit.id)) {
          toggleHabit(linkedHabit.id);
        }
        return;
      }

      // 2. Fallback cho các thói quen cũ chưa gán linkedDeckId
      const fallbackHabit = habits.find(
        (h) =>
          h.title.toLowerCase().includes('thẻ') ||
          h.title.toLowerCase().includes('anki') ||
          h.title.toLowerCase().includes('từ vựng')
      );
      if (fallbackHabit && !isHabitCompletedToday(fallbackHabit.id)) {
        toggleHabit(fallbackHabit.id);
      }
    },
    [habits, isHabitCompletedToday, toggleHabit]
  );

  const addNote = useCallback(
    async (content: string, tag?: string, ritual?: RitualTime) => {
      const newNote: MicroNote = {
        id: `note-${Date.now()}`,
        content: content.trim(),
        tag,
        ritual,
        date: todayDate,
        createdAt: new Date().toISOString()
      };

      setNotes(prev => [newNote, ...prev]);

      if (user) {
        await syncNote(user.uid, newNote);
      }

      if (profile.soundEnabled) {
        playZenTapSound();
      }
    },
    [todayDate, user, profile.soundEnabled]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (user) {
        await removeNote(user.uid, id);
      }
    },
    [user]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      if (user) {
        await syncProfile(user.uid, updated);
      }
    },
    [profile, user]
  );

  const getHabitsByRitual = useCallback(
    (ritual: RitualTime): Habit[] => {
      return habits
        .filter(h => h.ritual === ritual)
        .filter(h => (activeTag ? h.category === activeTag : true))
        .filter(h => (searchQuery ? h.title.toLowerCase().includes(searchQuery.toLowerCase()) : true))
        .sort((a, b) => a.order - b.order);
    },
    [habits, activeTag, searchQuery]
  );

  const value = useMemo(
    () => ({
      habits,
      logs,
      notes,
      profile,
      todayDate,
      isHabitCompletedToday,
      toggleHabit,
      addHabit,
      deleteHabit,
      addNote,
      deleteNote,
      updateProfile,
      completedTodayCount,
      totalActiveHabits,
      completionRate,
      topStreak,
      hasNeverMissTwiceAlert,
      getHabitsByRitual,
      activeTab,
      setActiveTab,
      flashcardsResetKey,
      resetFlashcardsToList,
      activeTag,
      setActiveTag,
      searchQuery,
      setSearchQuery,
      isCloudSynced,
      activeReviewDeckId,
      startDeckReview,
      clearDeckReview,
      completeHabitByDeckId
    }),
    [
      habits,
      logs,
      notes,
      profile,
      todayDate,
      isHabitCompletedToday,
      toggleHabit,
      addHabit,
      deleteHabit,
      addNote,
      deleteNote,
      updateProfile,
      completedTodayCount,
      totalActiveHabits,
      completionRate,
      topStreak,
      hasNeverMissTwiceAlert,
      getHabitsByRitual,
      activeTab,
      setActiveTab,
      flashcardsResetKey,
      resetFlashcardsToList,
      activeTag,
      searchQuery,
      isCloudSynced,
      activeReviewDeckId,
      startDeckReview,
      clearDeckReview,
      completeHabitByDeckId
    ]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

export const useHabits = (): HabitContextType => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
