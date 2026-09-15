import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { PuzzleKind } from '@/logic/daily';
import { todayKey, type DateKey } from '@/logic/dateKey';
import { statsFrom, type ProgressMap, type Stats } from '@/logic/progress';

const STORAGE_KEY = 'loopwits.progress.v1';

interface ProgressState {
  progress: ProgressMap;
  /** False until the saved progress has been read; gates rendering a streak. */
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  markSolved: (key: DateKey, kind: PuzzleKind, seconds: number) => void;
  stats: (today?: DateKey) => Stats;
  resetForTests: () => void;
}

async function persist(progress: ProgressMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // A failed write costs this session's progress, not the app. Retrying here
    // would only fail again for the same reason (a full or locked store).
  }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: {},
  isHydrated: false,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      // A corrupt blob must not wipe the app: fall back to empty rather than
      // throwing out of a render.
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      const progress =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as ProgressMap)
          : {};
      set({ progress, isHydrated: true });
    } catch {
      set({ progress: {}, isHydrated: true });
    }
  },

  markSolved(key, kind, seconds) {
    const current = get().progress;
    const day = current[key] ?? { solved: {} };
    // Never overwrite a faster earlier time — replaying a solved puzzle should
    // not make the record worse.
    const previous = day.seconds?.[kind];
    const next: ProgressMap = {
      ...current,
      [key]: {
        solved: { ...day.solved, [kind]: true },
        seconds: {
          ...day.seconds,
          [kind]: previous !== undefined ? Math.min(previous, seconds) : seconds,
        },
      },
    };
    set({ progress: next });
    void persist(next);
  },

  stats(today = todayKey()) {
    return statsFrom(get().progress, today);
  },

  resetForTests() {
    set({ progress: {}, isHydrated: false });
  },
}));
