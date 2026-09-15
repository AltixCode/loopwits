import type { RulersPuzzle } from './validate';

/**
 * Backtracking solver for Rulers.
 *
 * Used twice: to prove a generated puzzle has exactly one solution, and to give
 * the player a hint. Both need speed more than elegance, so it walks rows in
 * order and prunes on the three rules as it goes rather than building a
 * general constraint engine.
 */

/** A solution as one column index per row, or null when there is none. */
export type RulersSolution = number[];

interface SearchState {
  usedColumns: boolean[];
  usedRegions: boolean[];
  /** The column chosen in the previous row, for the no-touching rule. */
  placed: number[];
}

function canPlace(puzzle: RulersPuzzle, state: SearchState, row: number, col: number): boolean {
  if (state.usedColumns[col]) return false;
  const region = puzzle.regions[row]?.[col];
  if (region === undefined || state.usedRegions[region]) return false;
  // Only the previous row can touch this one: rows further back are at least
  // two apart vertically.
  if (row > 0) {
    const previous = state.placed[row - 1];
    if (previous !== undefined && Math.abs(previous - col) <= 1) return false;
  }
  return true;
}

function search(
  puzzle: RulersPuzzle,
  state: SearchState,
  row: number,
  limit: number,
  onSolution: (solution: RulersSolution) => void,
  counter: { found: number },
): void {
  if (counter.found >= limit) return;
  if (row === puzzle.size) {
    counter.found += 1;
    onSolution([...state.placed]);
    return;
  }
  for (let col = 0; col < puzzle.size; col += 1) {
    if (!canPlace(puzzle, state, row, col)) continue;
    const region = puzzle.regions[row]![col]!;
    state.usedColumns[col] = true;
    state.usedRegions[region] = true;
    state.placed[row] = col;
    search(puzzle, state, row + 1, limit, onSolution, counter);
    state.usedColumns[col] = false;
    state.usedRegions[region] = false;
    state.placed[row] = -1;
    if (counter.found >= limit) return;
  }
}

function freshState(size: number): SearchState {
  return {
    usedColumns: Array.from({ length: size }, () => false),
    usedRegions: Array.from({ length: size }, () => false),
    placed: Array.from({ length: size }, () => -1),
  };
}

/** The first solution found, or null. Deterministic: rows and columns in order. */
export function solve(puzzle: RulersPuzzle): RulersSolution | null {
  let answer: RulersSolution | null = null;
  search(puzzle, freshState(puzzle.size), 0, 1, (s) => {
    answer = s;
  }, { found: 0 });
  return answer;
}

/** Up to `limit` solutions, in the solver's deterministic order. */
export function findSolutions(puzzle: RulersPuzzle, limit = 2): RulersSolution[] {
  const out: RulersSolution[] = [];
  search(puzzle, freshState(puzzle.size), 0, limit, (s) => out.push(s), { found: 0 });
  return out;
}

/**
 * How many solutions the puzzle has, counted no further than `limit`.
 *
 * The cap is the point: uniqueness only needs "exactly one or more than one",
 * and enumerating every solution of a large grid costs minutes per puzzle.
 */
export function countSolutions(puzzle: RulersPuzzle, limit = 2): number {
  const counter = { found: 0 };
  search(puzzle, freshState(puzzle.size), 0, limit, () => {}, counter);
  return counter.found;
}
