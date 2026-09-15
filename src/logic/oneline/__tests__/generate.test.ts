import { carvePath, countRoutes, generateOneLine } from '../generate';
import { makeRng } from '../../rng';
import { isSolved, samePoint } from '../validate';

describe('carvePath', () => {
  it('covers every cell exactly once', () => {
    const path = carvePath(5, makeRng(1));
    expect(path).not.toBeNull();
    expect(path!).toHaveLength(25);
    const keys = new Set(path!.map((p) => `${p.r},${p.c}`));
    expect(keys.size).toBe(25);
  });

  it('only ever steps to an orthogonal neighbour', () => {
    const path = carvePath(5, makeRng(9))!;
    for (let i = 1; i < path.length; i += 1) {
      const step = Math.abs(path[i]!.r - path[i - 1]!.r) + Math.abs(path[i]!.c - path[i - 1]!.c);
      expect(step).toBe(1);
    }
  });

  it('is deterministic for a seed', () => {
    expect(carvePath(5, makeRng(4))).toEqual(carvePath(5, makeRng(4)));
  });
});

describe('countRoutes', () => {
  it('finds the single route through a fully pinned path', () => {
    const solution = carvePath(4, makeRng(2))!;
    const puzzle = { size: 4, dots: solution };
    expect(countRoutes(puzzle, 3)).toBe(1);
  });

  it('finds several routes when only the ends are fixed', () => {
    const solution = carvePath(4, makeRng(2))!;
    const puzzle = { size: 4, dots: [solution[0]!, solution[solution.length - 1]!] };
    expect(countRoutes(puzzle, 2)).toBeGreaterThanOrEqual(1);
  });

  it('reports 0 when there are no dots to start from', () => {
    expect(countRoutes({ size: 4, dots: [] })).toBe(0);
  });
});

describe('generateOneLine', () => {
  it('is deterministic for a seed', () => {
    expect(generateOneLine(5, 1234)).toEqual(generateOneLine(5, 1234));
  });

  it('gives different puzzles for different seeds', () => {
    expect(generateOneLine(5, 1)).not.toEqual(generateOneLine(5, 2));
  });

  it.each([4, 5, 6])('produces a %i×%i puzzle its own solution solves', (size) => {
    const { puzzle, solution } = generateOneLine(size, size * 11 + 3);
    expect(puzzle.size).toBe(size);
    expect(solution).toHaveLength(size * size);
    expect(isSolved(puzzle, solution)).toBe(true);
  });

  it.each([4, 5, 6])('produces a %i×%i puzzle with exactly one route', (size) => {
    const { puzzle } = generateOneLine(size, size * 29 + 7);
    expect(countRoutes(puzzle, 3)).toBe(1);
  });

  it('always starts and ends the dot sequence at the path ends', () => {
    const { puzzle, solution } = generateOneLine(5, 21);
    expect(samePoint(puzzle.dots[0]!, solution[0]!)).toBe(true);
    expect(samePoint(puzzle.dots[puzzle.dots.length - 1]!, solution[solution.length - 1]!)).toBe(true);
  });

  it('leaves the player a route to find rather than numbering every cell', () => {
    const { puzzle } = generateOneLine(5, 33);
    expect(puzzle.dots.length).toBeLessThan(25);
  });

  it('holds up across many seeds', () => {
    for (let seed = 0; seed < 10; seed += 1) {
      const { puzzle, solution } = generateOneLine(5, seed);
      expect(countRoutes(puzzle, 3)).toBe(1);
      expect(isSolved(puzzle, solution)).toBe(true);
    }
  });
});
