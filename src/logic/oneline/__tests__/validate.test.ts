import { isSolved, problemsWith, samePoint, type OneLinePuzzle, type Point } from '../validate';

const p = (r: number, c: number): Point => ({ r, c });

/** A 3×3 grid whose dots sit at the two ends of a boustrophedon sweep. */
const PUZZLE: OneLinePuzzle = {
  size: 3,
  dots: [p(0, 0), p(1, 0), p(2, 2)],
};

/** (0,0)→(0,1)→(0,2)→(1,2)→(1,1)→(1,0)→(2,0)→(2,1)→(2,2) — a full sweep. */
const FULL = [p(0, 0), p(0, 1), p(0, 2), p(1, 2), p(1, 1), p(1, 0), p(2, 0), p(2, 1), p(2, 2)];

describe('samePoint', () => {
  it('compares by value, not identity', () => {
    expect(samePoint(p(1, 2), p(1, 2))).toBe(true);
    expect(samePoint(p(1, 2), p(2, 1))).toBe(false);
  });
});

describe('problemsWith', () => {
  it('accepts an empty path — the player has not started', () => {
    expect(problemsWith(PUZZLE, [])).toEqual([]);
  });

  it('accepts a legal partial path, because the UI asks after every cell', () => {
    expect(problemsWith(PUZZLE, [p(0, 0), p(0, 1)])).toEqual([]);
  });

  it('rejects a path that does not start on the first dot', () => {
    expect(problemsWith(PUZZLE, [p(1, 1)])).toContain('wrong-start');
  });

  it('rejects a jump between non-neighbours', () => {
    expect(problemsWith(PUZZLE, [p(0, 0), p(2, 2)])).toContain('not-adjacent');
  });

  it('rejects a diagonal step', () => {
    expect(problemsWith(PUZZLE, [p(0, 0), p(1, 1)])).toContain('not-adjacent');
  });

  it('rejects revisiting a cell', () => {
    expect(problemsWith(PUZZLE, [p(0, 0), p(0, 1), p(0, 0)])).toContain('revisits');
  });

  it('rejects stepping outside the grid', () => {
    expect(problemsWith(PUZZLE, [p(0, 0), p(0, -1)])).toContain('revisits');
  });

  it('rejects reaching a later dot before an earlier one', () => {
    // (2,2) is dot 3 and is reached before dot 2 at (1,0).
    const path = [p(0, 0), p(1, 0)];
    expect(problemsWith(PUZZLE, path)).toEqual([]);
    const skipping = [p(0, 0), p(0, 1), p(0, 2), p(1, 2), p(2, 2)];
    expect(problemsWith(PUZZLE, skipping)).toContain('dot-out-of-order');
  });

  it('finds nothing wrong with the full intended path', () => {
    expect(problemsWith(PUZZLE, FULL)).toEqual([]);
  });
});

describe('isSolved', () => {
  it('accepts a path covering every cell and ending on the last dot', () => {
    expect(isSolved(PUZZLE, FULL)).toBe(true);
  });

  it('rejects a path that misses cells', () => {
    expect(isSolved(PUZZLE, FULL.slice(0, 8))).toBe(false);
  });

  it('rejects a full-length path that breaks a rule', () => {
    const bad = [...FULL];
    bad[8] = p(0, 0);
    expect(isSolved(PUZZLE, bad)).toBe(false);
  });
});
