import { useMemo } from 'react';

import { puzzlesFor, type DailyPuzzles } from '@/logic/daily';
import type { DateKey } from '@/logic/dateKey';

/**
 * The three puzzles for a day.
 *
 * Generation is deterministic but not free — a hard day costs a few hundred
 * milliseconds — so it is memoised per date. Regenerating on every render made
 * the hub stutter whenever the streak changed.
 */
export function usePuzzleDay(key: DateKey): DailyPuzzles {
  return useMemo(() => puzzlesFor(key), [key]);
}
