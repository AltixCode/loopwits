import { generateDuo } from '../generate';
import { countSolutions } from '../solve';
import { isSolved } from '../validate';

describe('generateDuo', () => {
  it('is deterministic for a seed', () => {
    expect(generateDuo(6, 777)).toEqual(generateDuo(6, 777));
  });

  it('gives different puzzles for different seeds', () => {
    expect(generateDuo(6, 1)).not.toEqual(generateDuo(6, 2));
  });

  it('rejects an odd size, which can never balance a row', () => {
    expect(() => generateDuo(5, 1)).toThrow(/even size/);
  });

  it.each([4, 6])('produces a %i×%i puzzle whose answer is legal', (size) => {
    const { puzzle, solution } = generateDuo(size, size * 100 + 1);
    expect(puzzle.size).toBe(size);
    expect(isSolved(puzzle, solution)).toBe(true);
  });

  it.each([4, 6])('produces a %i×%i puzzle with exactly one solution', (size) => {
    const { puzzle } = generateDuo(size, size * 17 + 9);
    expect(countSolutions(puzzle, 3)).toBe(1);
  });

  it('leaves the player something to do — it does not simply reveal the answer', () => {
    const { puzzle } = generateDuo(6, 31);
    const revealed = puzzle.given.flat().filter(Boolean).length;
    expect(revealed).toBeLessThan(6 * 6 * 0.75);
  });

  it('carries links, which is what makes it deduction rather than sudoku', () => {
    const { puzzle } = generateDuo(6, 5);
    expect(puzzle.links.length).toBeGreaterThan(0);
  });

  it('holds up across many seeds, not just lucky ones', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const { puzzle, solution } = generateDuo(6, seed);
      expect(countSolutions(puzzle, 3)).toBe(1);
      expect(isSolved(puzzle, solution)).toBe(true);
    }
  });
});
