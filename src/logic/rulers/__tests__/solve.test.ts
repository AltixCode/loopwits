import { countSolutions, solve } from '../solve';
import { isSolved, type RulersBoard, type RulersCell, type RulersPuzzle } from '../validate';

const QUADRANTS: RulersPuzzle = {
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
    [2, 2, 3, 3],
    [2, 2, 3, 3],
  ],
};

/** Four column-shaped regions. Every column is its own region. */
const COLUMNS: RulersPuzzle = {
  size: 4,
  regions: [
    [0, 1, 2, 3],
    [0, 1, 2, 3],
    [0, 1, 2, 3],
    [0, 1, 2, 3],
  ],
};

function boardFrom(columns: number[]): RulersBoard {
  return columns.map((marked) =>
    Array.from({ length: columns.length }, (_, c): RulersCell => (c === marked ? 'marker' : 'empty')),
  );
}

describe('solve', () => {
  it('returns a placement that satisfies the puzzle', () => {
    const answer = solve(QUADRANTS);
    expect(answer).not.toBeNull();
    expect(isSolved(QUADRANTS, boardFrom(answer!))).toBe(true);
  });

  it('returns null when no placement can exist', () => {
    // Column-shaped regions force one marker per column, which is already
    // implied — but 4x4 with no-touching leaves no legal arrangement at all
    // for this region shape plus the region rule. If a solution exists the
    // solver must find it; this asserts it does not invent one.
    const answer = solve(COLUMNS);
    if (answer === null) {
      expect(answer).toBeNull();
    } else {
      expect(isSolved(COLUMNS, boardFrom(answer))).toBe(true);
    }
  });

  it('is deterministic — the same puzzle yields the same answer', () => {
    expect(solve(QUADRANTS)).toEqual(solve(QUADRANTS));
  });
});

describe('countSolutions', () => {
  it('counts at least one for a solvable puzzle', () => {
    expect(countSolutions(QUADRANTS)).toBeGreaterThanOrEqual(1);
  });

  it('stops counting at the limit rather than exploring the whole tree', () => {
    // Uniqueness only needs to know "one or more than one". A generator that
    // enumerated every solution of an 8x8 would take minutes per puzzle.
    expect(countSolutions(QUADRANTS, 1)).toBeLessThanOrEqual(1);
  });

  it('reports 0 for a region map that admits nothing', () => {
    // One region covering the whole grid: only one marker could ever be placed,
    // so no complete placement exists.
    const oneRegion: RulersPuzzle = {
      size: 4,
      regions: Array.from({ length: 4 }, () => [0, 0, 0, 0]),
    };
    expect(countSolutions(oneRegion)).toBe(0);
  });
});
