import { addDays, daysBetween, type DateKey } from './dateKey';
import type { PuzzleKind } from './daily';

/**
 * Per-day progress and the streak derived from it.
 *
 * Pure: the store persists this, the screens render it, but every rule about
 * what counts as a completed day and when a streak breaks lives here, where it
 * can be tested exhaustively without a device.
 */

export interface DayProgress {
  /** Which of the three puzzles are solved. */
  solved: Partial<Record<PuzzleKind, boolean>>;
  /** Seconds spent, per puzzle, for the stats screen. */
  seconds?: Partial<Record<PuzzleKind, number>>;
}

export type ProgressMap = Record<DateKey, DayProgress>;

export const ALL_KINDS: PuzzleKind[] = ['rulers', 'duo', 'oneline'];

/** How many of the day's three puzzles are solved. */
export function solvedCount(day: DayProgress | undefined): number {
  if (!day) return 0;
  return ALL_KINDS.filter((kind) => day.solved[kind]).length;
}

/** A day counts towards the streak only when all three are solved. */
export function isDayComplete(day: DayProgress | undefined): boolean {
  return solvedCount(day) === ALL_KINDS.length;
}

/**
 * The current streak, counted backwards from today.
 *
 * Today not being finished yet does **not** break the streak — it is still in
 * progress until midnight. Counting from today when today is incomplete would
 * show a player their streak had reset at breakfast, which is both wrong and
 * the single most demoralising bug a daily game can have.
 */
export function currentStreak(progress: ProgressMap, today: DateKey): number {
  let cursor = isDayComplete(progress[today]) ? today : addDays(today, -1);
  let streak = 0;
  while (isDayComplete(progress[cursor])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** The longest run of complete days ever recorded. */
export function bestStreak(progress: ProgressMap): number {
  const complete = Object.keys(progress)
    .filter((key) => isDayComplete(progress[key]))
    .sort();
  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const key of complete) {
    run = previous && daysBetween(previous, key) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    previous = key;
  }
  return best;
}

export interface Stats {
  daysPlayed: number;
  daysComplete: number;
  puzzlesSolved: number;
  currentStreak: number;
  bestStreak: number;
  /** Solved puzzles per kind, for the breakdown on the stats screen. */
  byKind: Record<PuzzleKind, number>;
}

export function statsFrom(progress: ProgressMap, today: DateKey): Stats {
  const days = Object.values(progress);
  const byKind = { rulers: 0, duo: 0, oneline: 0 } as Record<PuzzleKind, number>;
  for (const day of days) {
    for (const kind of ALL_KINDS) if (day.solved[kind]) byKind[kind] += 1;
  }
  return {
    daysPlayed: days.filter((day) => solvedCount(day) > 0).length,
    daysComplete: days.filter(isDayComplete).length,
    puzzlesSolved: ALL_KINDS.reduce((sum, kind) => sum + byKind[kind], 0),
    currentStreak: currentStreak(progress, today),
    bestStreak: bestStreak(progress),
    byKind,
  };
}

/** Free users may reach back this many days; Pro unlocks everything. */
export const FREE_ARCHIVE_DAYS = 7;

/** Whether a past day is playable on the current entitlement. */
export function canPlay(key: DateKey, today: DateKey, isPremium: boolean): boolean {
  const age = daysBetween(key, today);
  if (age < 0) return false; // The future is not playable, ever.
  if (isPremium) return true;
  return age < FREE_ARCHIVE_DAYS;
}
