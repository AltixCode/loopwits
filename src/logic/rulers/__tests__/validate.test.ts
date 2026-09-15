import { conflictsIn, isSolved, markersOf, type RulersBoard, type RulersPuzzle } from '../validate';

/**
 * A 4×4 board whose regions are the four quadrants:
 *
 *   0 0 1 1
 *   0 0 1 1
 *   2 2 3 3
 *   2 2 3 3
 */
const QUADRANTS: RulersPuzzle = {
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
    [2, 2, 3, 3],
    [2, 2, 3, 3],
  ],
};

/** Builds a board from one column index per row; -1 means "no marker". */
function board(columns: number[], size = 4): RulersBoard {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (columns[r] === c ? 'marker' : 'empty')),
  );
}

describe('markersOf', () => {
  it('reads one marker per row as a column index', () => {
    expect(markersOf(board([1, 3, 0, 2]))).toEqual([1, 3, 0, 2]);
  });

  it('reports -1 for a row with no marker', () => {
    expect(markersOf(board([1, -1, 0, 2]))).toEqual([1, -1, 0, 2]);
  });

  it('ignores crossed-out notes, which are the player thinking, not an answer', () => {
    const b = board([1, 3, 0, 2]);
    b[0]![2] = 'crossed';
    expect(markersOf(b)).toEqual([1, 3, 0, 2]);
  });

  it('reports -1 when a row holds more than one marker', () => {
    // Ambiguous is not "the first one" — a row with two markers has no answer.
    const b = board([1, 3, 0, 2]);
    b[0]![3] = 'marker';
    expect(markersOf(b)[0]).toBe(-1);
  });
});

describe('isSolved', () => {
  it('accepts a placement that satisfies every rule', () => {
    // (0,1) (1,3) (2,0) (3,2): one per row, column and quadrant, none touching.
    expect(isSolved(QUADRANTS, board([1, 3, 0, 2]))).toBe(true);
  });

  it('rejects an incomplete board', () => {
    expect(isSolved(QUADRANTS, board([1, 3, 0, -1]))).toBe(false);
  });

  it('rejects two markers in one column', () => {
    expect(isSolved(QUADRANTS, board([1, 3, 1, 2]))).toBe(false);
  });

  it('rejects two markers in one region', () => {
    // (0,0) and (1,1) are both in region 0.
    expect(isSolved(QUADRANTS, board([0, 1, 2, 3]))).toBe(false);
  });

  it('rejects diagonally touching markers — the rule that makes this not N-queens', () => {
    // (0,0) and (1,1) touch corner to corner.
    expect(isSolved(QUADRANTS, board([0, 1, 3, 2]))).toBe(false);
  });

  it('rejects vertically adjacent markers', () => {
    expect(isSolved(QUADRANTS, board([0, 2, 1, 3]))).toBe(false);
  });
});

describe('conflictsIn', () => {
  it('finds nothing on a correct board', () => {
    expect(conflictsIn(QUADRANTS, board([1, 3, 0, 2]))).toEqual([]);
  });

  it('finds nothing on a partial board that is still consistent', () => {
    // Highlighting a half-finished board as wrong would make the feature useless.
    expect(conflictsIn(QUADRANTS, board([1, 3, -1, -1]))).toEqual([]);
  });

  it('names both cells of a column clash', () => {
    const found = conflictsIn(QUADRANTS, board([1, 1, -1, -1]));
    expect(found).toEqual(
      expect.arrayContaining([
        { row: 0, col: 1, reason: 'column' },
        { row: 1, col: 1, reason: 'column' },
      ]),
    );
  });

  it('names both cells of a region clash', () => {
    const found = conflictsIn(QUADRANTS, board([0, 1, -1, -1]));
    expect(found.some((c) => c.reason === 'region')).toBe(true);
  });

  it('names both cells of an adjacency clash', () => {
    // (1,1) and (2,2) touch only diagonally: different columns, different
    // regions. Any pair that also shared a column or region would be reported
    // under that rule instead, and this rule would go untested.
    const found = conflictsIn(QUADRANTS, board([-1, 1, 2, -1]));
    expect(found).toEqual(
      expect.arrayContaining([
        { row: 1, col: 1, reason: 'adjacent' },
        { row: 2, col: 2, reason: 'adjacent' },
      ]),
    );
  });

  it('reports a cell once even when it breaks several rules at once', () => {
    const found = conflictsIn(QUADRANTS, board([0, 1, -1, -1]));
    const keys = found.map((c) => `${c.row},${c.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
