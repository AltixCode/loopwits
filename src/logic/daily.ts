import { dayIndex, type DateKey } from './dateKey';
import { generateDuo, type GeneratedDuo } from './duo/generate';
import { generateOneLine, type GeneratedOneLine } from './oneline/generate';
import { generateRulers, type GeneratedRulers } from './rulers/generate';
import { seedFromKey } from './rng';

/**
 * The day's three puzzles.
 *
 * A pure function of the date, so there is no backend, no network dependency
 * and nothing to keep in sync: every device generates the identical trio for a
 * given day, forever. The seed is derived per puzzle type so the three do not
 * share a random stream — with one seed, a "hard" day would be hard in all
 * three at once, which reads as the app being broken rather than varied.
 */

export type PuzzleKind = 'rulers' | 'duo' | 'oneline';

export const PUZZLE_KINDS: PuzzleKind[] = ['rulers', 'duo', 'oneline'];

export interface DailyPuzzles {
  key: DateKey;
  rulers: GeneratedRulers;
  duo: GeneratedDuo;
  oneline: GeneratedOneLine;
}

/**
 * Sizes step up over a seven-day cycle so a week has a shape — a gentle Monday,
 * a chewier Saturday — without any day being unfair.
 */
export function sizesFor(key: DateKey): { rulers: number; duo: number; oneline: number } {
  const phase = ((dayIndex(key) % 7) + 7) % 7;
  return {
    rulers: phase < 2 ? 6 : phase < 5 ? 7 : 8,
    // Duo must be even; 6 and 8 are the only sensible options on a phone.
    duo: phase < 4 ? 6 : 8,
    oneline: phase < 3 ? 5 : 6,
  };
}

function seedFor(key: DateKey, kind: PuzzleKind): number {
  return seedFromKey(`${key}:${kind}`);
}

export function puzzlesFor(key: DateKey): DailyPuzzles {
  const sizes = sizesFor(key);
  return {
    key,
    rulers: generateRulers(sizes.rulers, seedFor(key, 'rulers')),
    duo: generateDuo(sizes.duo, seedFor(key, 'duo')),
    oneline: generateOneLine(sizes.oneline, seedFor(key, 'oneline')),
  };
}
