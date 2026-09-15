import { countSolutions, findSolutions, solve } from '../solve';
import { emptyGrid, isSolved, type DuoPuzzle } from '../validate';

const blank = (size: number): DuoPuzzle => ({ size, given: emptyGrid(size), links: [] });

describe('solve', () => {
  it('solves an empty 4×4 grid', () => {
    const puzzle = blank(4);
    const answer = solve(puzzle);
    expect(answer).not.toBeNull();
    expect(isSolved(puzzle, answer!)).toBe(true);
  });

  it('solves an empty 6×6 grid', () => {
    const puzzle = blank(6);
    const answer = solve(puzzle);
    expect(answer).not.toBeNull();
    expect(isSolved(puzzle, answer!)).toBe(true);
  });

  it('respects given cells', () => {
    const given = emptyGrid(4);
    given[0]![0] = 'moon';
    const puzzle: DuoPuzzle = { size: 4, given, links: [] };
    const answer = solve(puzzle);
    expect(answer?.[0]?.[0]).toBe('moon');
    expect(isSolved(puzzle, answer!)).toBe(true);
  });

  it('respects links', () => {
    const puzzle: DuoPuzzle = {
      size: 4,
      given: emptyGrid(4),
      links: [{ a: { r: 0, c: 0 }, b: { r: 0, c: 1 }, kind: 'equal' }],
    };
    const answer = solve(puzzle)!;
    expect(answer[0]![0]).toBe(answer[0]![1]);
    expect(isSolved(puzzle, answer)).toBe(true);
  });

  it('returns null when the givens contradict the rules', () => {
    const given = emptyGrid(4);
    given[0]![0] = 'sun';
    given[0]![1] = 'sun';
    given[0]![2] = 'sun';
    expect(solve({ size: 4, given, links: [] })).toBeNull();
  });

  it('never returns a grid the game itself would call wrong', () => {
    // The solver prunes with the same rules the UI validates with; if they ever
    // disagree, a player is told their correct answer is wrong.
    for (const size of [4, 6]) {
      const puzzle = blank(size);
      findSolutions(puzzle, 5).forEach((grid) => expect(isSolved(puzzle, grid)).toBe(true));
    }
  });
});

describe('countSolutions', () => {
  it('finds an empty grid wildly ambiguous', () => {
    expect(countSolutions(blank(6), 5)).toBe(5);
  });

  it('stops at the limit', () => {
    expect(countSolutions(blank(6), 1)).toBe(1);
  });

  it('reports 0 for an impossible puzzle', () => {
    const given = emptyGrid(4);
    given[0] = ['sun', 'sun', 'sun', 'moon'];
    expect(countSolutions({ size: 4, given, links: [] })).toBe(0);
  });
});
