import { PUZZLE_KINDS, puzzlesFor, sizesFor } from '../daily';
import { countSolutions as countDuo } from '../duo/solve';
import { isSolved as duoSolved } from '../duo/validate';
import { countRoutes } from '../oneline/generate';
import { isSolved as oneLineSolved } from '../oneline/validate';
import { countSolutions as countRulers } from '../rulers/solve';
import { isSolved as rulersSolved } from '../rulers/validate';

function rulersBoard(columns: number[]) {
  return columns.map((marked) =>
    Array.from({ length: columns.length }, (_, c) => (c === marked ? ('marker' as const) : ('empty' as const))),
  );
}

describe('PUZZLE_KINDS', () => {
  it('is the trio the app promises', () => {
    expect(PUZZLE_KINDS).toEqual(['rulers', 'duo', 'oneline']);
  });
});

describe('sizesFor', () => {
  it('is stable for a given day', () => {
    expect(sizesFor('2026-09-15')).toEqual(sizesFor('2026-09-15'));
  });

  it('keeps Duo even, because an odd row can never balance', () => {
    for (let d = 1; d <= 28; d += 1) {
      const key = `2026-09-${String(d).padStart(2, '0')}`;
      expect(sizesFor(key).duo % 2).toBe(0);
    }
  });

  it('varies across a week rather than being one difficulty forever', () => {
    const week = Array.from({ length: 7 }, (_, i) => sizesFor(`2026-09-${String(14 + i).padStart(2, '0')}`));
    expect(new Set(week.map((s) => JSON.stringify(s))).size).toBeGreaterThan(1);
  });

  it('handles dates before the epoch without a negative phase', () => {
    const sizes = sizesFor('2025-06-01');
    expect(sizes.rulers).toBeGreaterThanOrEqual(6);
    expect(sizes.duo % 2).toBe(0);
  });
});

describe('puzzlesFor', () => {
  it('is deterministic — every device must get the same day', () => {
    expect(puzzlesFor('2026-09-15')).toEqual(puzzlesFor('2026-09-15'));
  });

  it('gives different puzzles on different days', () => {
    expect(puzzlesFor('2026-09-15')).not.toEqual(puzzlesFor('2026-09-16'));
  });

  it('does not reuse one random stream across the three puzzles', () => {
    // With a single seed the three would rise and fall together, which reads as
    // the app being broken rather than varied.
    const a = puzzlesFor('2026-09-15');
    const b = puzzlesFor('2026-09-16');
    expect(a.rulers.solution).not.toEqual(b.rulers.solution);
    expect(a.oneline.solution).not.toEqual(b.oneline.solution);
  });

  it.each(['2026-09-15', '2026-09-18', '2026-09-20'])(
    'ships three genuinely solvable puzzles on %s',
    (key) => {
      const day = puzzlesFor(key);

      expect(rulersSolved(day.rulers.puzzle, rulersBoard(day.rulers.solution))).toBe(true);
      expect(countRulers(day.rulers.puzzle, 3)).toBe(1);

      expect(duoSolved(day.duo.puzzle, day.duo.solution)).toBe(true);
      expect(countDuo(day.duo.puzzle, 3)).toBe(1);

      expect(oneLineSolved(day.oneline.puzzle, day.oneline.solution)).toBe(true);
      expect(countRoutes(day.oneline.puzzle, 3)).toBe(1);
    },
  );
});
