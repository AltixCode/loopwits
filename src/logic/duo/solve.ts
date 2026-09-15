import { emptyGrid, type DuoGrid, type DuoPuzzle, type DuoSymbol } from './validate';

/**
 * Backtracking solver for Duo.
 *
 * Pruning is **local**: after placing a symbol, only that cell's own row,
 * column and links can have become invalid, so only those are re-checked. The
 * obvious implementation — re-run the UI's whole-grid `conflictsIn` after every
 * placement — is correct but scans the entire board at every node of an
 * exponential search. It made generating one 8x8 day take minutes; this version
 * takes milliseconds, and a generator that slow cannot produce a year of
 * puzzles at build time.
 *
 * `solve.test.ts` asserts every solution this returns also satisfies the UI's
 * `isSolved`, so the two rule implementations cannot drift apart — that drift
 * is how a puzzle app ends up rejecting a correct answer.
 */

const opposite = (symbol: DuoSymbol): DuoSymbol => (symbol === 'sun' ? 'moon' : 'sun');

/** True when placing `symbol` at (r, c) breaks no rule involving that cell. */
function legalAt(puzzle: DuoPuzzle, grid: DuoGrid, r: number, c: number): boolean {
  const { size } = puzzle;
  const symbol = grid[r]![c]!;
  const half = size / 2;

  // No three alike in a row: only windows containing this cell can be new.
  for (let start = Math.max(0, c - 2); start <= Math.min(c, size - 3); start += 1) {
    const a = grid[r]![start];
    if (a && a === grid[r]![start + 1] && a === grid[r]![start + 2]) return false;
  }
  for (let start = Math.max(0, r - 2); start <= Math.min(r, size - 3); start += 1) {
    const a = grid[start]![c];
    if (a && a === grid[start + 1]![c] && a === grid[start + 2]![c]) return false;
  }

  // Balance: one symbol may never exceed half a line, even before it is full.
  let rowSame = 0;
  let colSame = 0;
  for (let i = 0; i < size; i += 1) {
    if (grid[r]![i] === symbol) rowSame += 1;
    if (grid[i]![c] === symbol) colSame += 1;
  }
  if (rowSame > half || colSame > half) return false;

  for (const link of puzzle.links) {
    const touchesA = link.a.r === r && link.a.c === c;
    const touchesB = link.b.r === r && link.b.c === c;
    if (!touchesA && !touchesB) continue;
    const a = grid[link.a.r]?.[link.a.c];
    const b = grid[link.b.r]?.[link.b.c];
    if (!a || !b) continue;
    const ok = link.kind === 'equal' ? a === b : a === opposite(b);
    if (!ok) return false;
  }

  return true;
}

function search(puzzle: DuoPuzzle, grid: DuoGrid, index: number, limit: number, out: DuoGrid[]): void {
  if (out.length >= limit) return;
  const { size } = puzzle;
  if (index === size * size) {
    out.push(grid.map((row) => [...row]));
    return;
  }
  const r = Math.floor(index / size);
  const c = index % size;

  const fixed = puzzle.given[r]?.[c] ?? null;
  const candidates: DuoSymbol[] = fixed ? [fixed] : ['sun', 'moon'];

  for (const symbol of candidates) {
    grid[r]![c] = symbol;
    if (legalAt(puzzle, grid, r, c)) search(puzzle, grid, index + 1, limit, out);
    grid[r]![c] = null;
    if (out.length >= limit) return;
  }
}

/** Up to `limit` solutions. */
export function findSolutions(puzzle: DuoPuzzle, limit = 2): DuoGrid[] {
  const out: DuoGrid[] = [];
  search(puzzle, emptyGrid(puzzle.size), 0, limit, out);
  return out;
}

export function solve(puzzle: DuoPuzzle): DuoGrid | null {
  return findSolutions(puzzle, 1)[0] ?? null;
}

export function countSolutions(puzzle: DuoPuzzle, limit = 2): number {
  return findSolutions(puzzle, limit).length;
}
