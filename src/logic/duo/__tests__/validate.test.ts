import {
  conflictsIn,
  emptyGrid,
  isSolved,
  type DuoGrid,
  type DuoPuzzle,
} from '../validate';

const S = 'sun' as const;
const M = 'moon' as const;
const _ = null;

/** A complete, legal 6×6 grid: balanced rows and columns, never three alike. */
const SOLVED: DuoGrid = [
  [S, S, M, S, M, M],
  [M, M, S, M, S, S],
  [S, M, S, S, M, M],
  [M, S, M, M, S, S],
  [S, M, S, M, S, M],
  [M, S, M, S, M, S],
];

const PLAIN: DuoPuzzle = { size: 6, given: emptyGrid(6), links: [] };

function withGiven(grid: DuoGrid): DuoPuzzle {
  return { size: 6, given: grid, links: [] };
}

describe('isSolved', () => {
  it('accepts a grid that satisfies every rule', () => {
    expect(isSolved(PLAIN, SOLVED)).toBe(true);
  });

  it('rejects an unfinished grid', () => {
    const partial = SOLVED.map((row) => [...row]);
    partial[0]![0] = _;
    expect(isSolved(PLAIN, partial)).toBe(false);
  });

  it('rejects a row that is not balanced', () => {
    const bad = SOLVED.map((row) => [...row]);
    bad[0] = [S, S, S, S, M, M];
    expect(isSolved(PLAIN, bad)).toBe(false);
  });

  it('rejects three of the same symbol in a row', () => {
    const bad = SOLVED.map((row) => [...row]);
    bad[0] = [S, S, S, M, M, M];
    expect(isSolved(PLAIN, bad)).toBe(false);
  });

  it('rejects three of the same symbol in a column', () => {
    const bad = SOLVED.map((row) => [...row]);
    bad[0]![0] = S;
    bad[1]![0] = S;
    bad[2]![0] = S;
    expect(isSolved(PLAIN, bad)).toBe(false);
  });

  it('honours an "equals" link between neighbours', () => {
    const linked: DuoPuzzle = {
      size: 6,
      given: emptyGrid(6),
      links: [{ a: { r: 0, c: 0 }, b: { r: 0, c: 1 }, kind: 'equal' }],
    };
    // SOLVED has S,S at (0,0)-(0,1) — the link holds.
    expect(isSolved(linked, SOLVED)).toBe(true);

    const broken: DuoPuzzle = {
      size: 6,
      given: emptyGrid(6),
      links: [{ a: { r: 0, c: 1 }, b: { r: 0, c: 2 }, kind: 'equal' }],
    };
    // (0,1)=S and (0,2)=M — an "equals" link is violated.
    expect(isSolved(broken, SOLVED)).toBe(false);
  });

  it('honours an "opposite" link between neighbours', () => {
    const linked: DuoPuzzle = {
      size: 6,
      given: emptyGrid(6),
      links: [{ a: { r: 0, c: 1 }, b: { r: 0, c: 2 }, kind: 'opposite' }],
    };
    expect(isSolved(linked, SOLVED)).toBe(true);
  });

  it('rejects a grid that contradicts a given cell', () => {
    const given = emptyGrid(6);
    given[0]![0] = M; // SOLVED has S there.
    expect(isSolved(withGiven(given), SOLVED)).toBe(false);
  });
});

describe('conflictsIn', () => {
  it('finds nothing on a correct grid', () => {
    expect(conflictsIn(PLAIN, SOLVED)).toEqual([]);
  });

  it('finds nothing on a partial grid that is still consistent', () => {
    const partial = emptyGrid(6);
    partial[0]![0] = S;
    partial[0]![1] = M;
    expect(conflictsIn(PLAIN, partial)).toEqual([]);
  });

  it('flags the third of three in a row', () => {
    const grid = emptyGrid(6);
    grid[0]![0] = S;
    grid[0]![1] = S;
    grid[0]![2] = S;
    const found = conflictsIn(PLAIN, grid);
    expect(found).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0, reason: 'triple' },
        { row: 0, col: 1, reason: 'triple' },
        { row: 0, col: 2, reason: 'triple' },
      ]),
    );
  });

  it('flags a row that already holds too many of one symbol', () => {
    const grid = emptyGrid(6);
    [0, 2, 4].forEach((c) => {
      grid[0]![c] = S;
    });
    grid[0]![1] = S;
    // Four suns in a six-wide row can never balance, even unfinished.
    expect(conflictsIn(PLAIN, grid).some((c) => c.reason === 'balance')).toBe(true);
  });

  it('flags a broken link', () => {
    const puzzle: DuoPuzzle = {
      size: 6,
      given: emptyGrid(6),
      links: [{ a: { r: 0, c: 0 }, b: { r: 0, c: 1 }, kind: 'opposite' }],
    };
    const grid = emptyGrid(6);
    grid[0]![0] = S;
    grid[0]![1] = S;
    expect(conflictsIn(puzzle, grid).some((c) => c.reason === 'link')).toBe(true);
  });
});
