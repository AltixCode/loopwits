import { generateRulers } from '../generate';
import { countSolutions } from '../solve';
import { isSolved } from '../validate';

function boardFrom(columns: number[]) {
  return columns.map(() => Array.from({ length: columns.length }, () => 'empty' as const)).map(
    (row, r) => row.map((_, c) => (columns[r] === c ? ('marker' as const) : ('empty' as const))),
  );
}

describe('generateRulers', () => {
  it('is deterministic for a seed — the same day must give everyone the same puzzle', () => {
    expect(generateRulers(6, 4242)).toEqual(generateRulers(6, 4242));
  });

  it('gives different puzzles for different seeds', () => {
    expect(generateRulers(6, 1)).not.toEqual(generateRulers(6, 2));
  });

  it.each([5, 6, 7, 8])('produces a well-formed %i×%i puzzle', (size) => {
    const { puzzle } = generateRulers(size, size * 1000 + 7);
    expect(puzzle.size).toBe(size);
    expect(puzzle.regions).toHaveLength(size);
    puzzle.regions.forEach((row) => expect(row).toHaveLength(size));
  });

  it.each([5, 6, 7, 8])('uses exactly %i regions, each non-empty and contiguous', (size) => {
    const { puzzle } = generateRulers(size, size * 31 + 5);
    const counts = new Map<number, number>();
    puzzle.regions.flat().forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));
    expect([...counts.keys()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: size }, (_, i) => i),
    );
    // Contiguity: a flood fill from any one cell of a region must reach them all.
    for (const region of counts.keys()) {
      const cells = [] as { r: number; c: number }[];
      puzzle.regions.forEach((row, r) =>
        row.forEach((value, c) => {
          if (value === region) cells.push({ r, c });
        }),
      );
      const seen = new Set<string>([`${cells[0]!.r},${cells[0]!.c}`]);
      const queue = [cells[0]!];
      while (queue.length) {
        const { r, c } = queue.shift()!;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (puzzle.regions[nr]?.[nc] === region && !seen.has(key)) {
            seen.add(key);
            queue.push({ r: nr, c: nc });
          }
        }
      }
      expect(seen.size).toBe(cells.length);
    }
  });

  it.each([5, 6, 7, 8])('returns a solution that actually solves the %i×%i puzzle', (size) => {
    const { puzzle, solution } = generateRulers(size, size * 77 + 3);
    expect(solution).toHaveLength(size);
    expect(isSolved(puzzle, boardFrom(solution))).toBe(true);
  });

  it.each([5, 6, 7, 8])('produces a %i×%i puzzle with exactly one solution', (size) => {
    // A puzzle with two answers is the defining defect of this genre: the
    // player deduces correctly, is marked wrong, and never trusts the app again.
    const { puzzle } = generateRulers(size, size * 13 + 11);
    expect(countSolutions(puzzle, 3)).toBe(1);
  });

  it('produces uniquely solvable puzzles across many seeds, not just lucky ones', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const { puzzle, solution } = generateRulers(7, seed);
      expect(countSolutions(puzzle, 3)).toBe(1);
      expect(isSolved(puzzle, boardFrom(solution))).toBe(true);
    }
  });
});
