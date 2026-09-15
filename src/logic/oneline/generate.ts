import { makeRng, shuffled, type Rng } from '../rng';
import { isSolved, type OneLinePath, type OneLinePuzzle, type Point, samePoint } from './validate';

/**
 * Generates a OneLine puzzle.
 *
 * A Hamiltonian path is hard to find but trivial to *build*: carve one with a
 * randomised depth-first walk that covers every cell, then place the numbered
 * dots along it. The walk is the answer, so the puzzle is correct by
 * construction and no solver is needed to produce it.
 *
 * Uniqueness is handled differently from the other two puzzles. A grid with
 * only a start and an end usually admits many paths, so difficulty and
 * uniqueness both come from how many dots are placed: more dots pin the route
 * down harder. The generator adds dots until the solver agrees only one route
 * survives.
 */

export interface GeneratedOneLine {
  puzzle: OneLinePuzzle;
  solution: OneLinePath;
}

const NEIGHBOURS = [
  { r: 1, c: 0 },
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 0, c: -1 },
] as const;

/** A path visiting every cell exactly once, or null if this attempt dead-ended. */
export function carvePath(size: number, rng: Rng): OneLinePath | null {
  const total = size * size;
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const path: Point[] = [];

  const start = { r: rng.int(size), c: rng.int(size) };
  visited[start.r]![start.c] = true;
  path.push(start);

  // Depth-first with a step budget: a full backtracking search for a
  // Hamiltonian path can take exponential time on larger grids, and a puzzle
  // generator that occasionally hangs is worse than one that occasionally
  // retries.
  let steps = 0;
  const budget = total * 400;

  const walk = (): boolean => {
    if (path.length === total) return true;
    if (steps++ > budget) return false;
    const here = path[path.length - 1]!;
    for (const delta of shuffled(NEIGHBOURS, rng)) {
      const next = { r: here.r + delta.r, c: here.c + delta.c };
      if (next.r < 0 || next.r >= size || next.c < 0 || next.c >= size) continue;
      if (visited[next.r]![next.c]) continue;
      visited[next.r]![next.c] = true;
      path.push(next);
      if (walk()) return true;
      path.pop();
      visited[next.r]![next.c] = false;
    }
    return false;
  };

  return walk() ? path : null;
}

/**
 * Counts routes through the dots, stopping at `limit`.
 *
 * The naive walk explores every self-avoiding path and is far too slow to run
 * dozens of times per generated puzzle — a plain search made one day's puzzles
 * take ~39 seconds. Two standard prunes cut that to milliseconds, and neither
 * changes which routes are counted:
 *
 *   - **Connectivity.** If the cells still unvisited fall into more than one
 *     connected group, no single path can cover them all. Abandon immediately.
 *   - **Dead ends.** Any unvisited cell with fewer than two unvisited
 *     neighbours must be an endpoint of the remaining path, and a path has at
 *     most one free end, so two such cells means failure.
 */
export function countRoutes(puzzle: OneLinePuzzle, limit = 2): number {
  const { size, dots } = puzzle;
  const total = size * size;
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const path: Point[] = [];
  let found = 0;

  const dotIndexAt = (p: Point) => dots.findIndex((d) => samePoint(d, p));

  const freeNeighbours = (r: number, c: number): number => {
    let n = 0;
    for (const d of NEIGHBOURS) {
      const nr = r + d.r;
      const nc = c + d.c;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr]![nc]) n += 1;
    }
    return n;
  };

  /** False when the unvisited cells can no longer form one path from `head`. */
  const reachable = (head: Point): boolean => {
    const remaining = total - path.length;
    if (remaining === 0) return true;

    // Flood fill the unvisited region from the head's free neighbours.
    const seen = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
    const stack: Point[] = [];
    for (const d of NEIGHBOURS) {
      const nr = head.r + d.r;
      const nc = head.c + d.c;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr]![nc] && !seen[nr]![nc]) {
        seen[nr]![nc] = true;
        stack.push({ r: nr, c: nc });
      }
    }
    let count = 0;
    while (stack.length) {
      const cell = stack.pop()!;
      count += 1;
      for (const d of NEIGHBOURS) {
        const nr = cell.r + d.r;
        const nc = cell.c + d.c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr]![nc] && !seen[nr]![nc]) {
          seen[nr]![nc] = true;
          stack.push({ r: nr, c: nc });
        }
      }
    }
    if (count !== remaining) return false;

    // At most one unvisited cell may be a dead end — the path's far endpoint.
    let deadEnds = 0;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (visited[r]![c]) continue;
        if (freeNeighbours(r, c) + (Math.abs(r - head.r) + Math.abs(c - head.c) === 1 ? 1 : 0) < 2) {
          deadEnds += 1;
          if (deadEnds > 1) return false;
        }
      }
    }
    return true;
  };

  const walk = (nextDot: number): void => {
    if (found >= limit) return;
    if (path.length === total) {
      // A complete route counts only if it ended on the final dot.
      if (nextDot === dots.length) found += 1;
      return;
    }
    const here = path[path.length - 1]!;
    if (!reachable(here)) return;

    for (const delta of NEIGHBOURS) {
      const next = { r: here.r + delta.r, c: here.c + delta.c };
      if (next.r < 0 || next.r >= size || next.c < 0 || next.c >= size) continue;
      if (visited[next.r]![next.c]) continue;

      const index = dotIndexAt(next);
      // Stepping onto a dot is only legal if it is the next one due.
      if (index !== -1 && index !== nextDot) continue;

      visited[next.r]![next.c] = true;
      path.push(next);
      walk(index === -1 ? nextDot : nextDot + 1);
      path.pop();
      visited[next.r]![next.c] = false;
      if (found >= limit) return;
    }
  };

  const first = dots[0];
  if (!first) return 0;
  visited[first.r]![first.c] = true;
  path.push(first);
  walk(1);
  return found;
}

export function generateOneLine(size: number, seed: number): GeneratedOneLine {
  const rng = makeRng(seed);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const solution = carvePath(size, rng);
    if (!solution) continue;

    // Start and end are always dots; interior dots are added, in path order,
    // until only one route survives.
    const interior = shuffled(
      solution.slice(1, -1).map((_, i) => i + 1),
      rng,
    );

    const chosen = new Set<number>([0, solution.length - 1]);
    const puzzleFor = () => ({
      size,
      dots: [...chosen].sort((a, b) => a - b).map((i) => solution[i]!),
    });

    let puzzle = puzzleFor();
    let unique = countRoutes(puzzle, 2) === 1;
    for (const index of interior) {
      if (unique) break;
      chosen.add(index);
      puzzle = puzzleFor();
      unique = countRoutes(puzzle, 2) === 1;
    }
    if (!unique) continue;

    // Drop any dot the route no longer needs — the first uniquely-determined
    // set is usually far more than the player requires.
    for (const index of shuffled([...chosen].filter((i) => i !== 0 && i !== solution.length - 1), rng)) {
      chosen.delete(index);
      const trimmed = puzzleFor();
      if (countRoutes(trimmed, 2) === 1) puzzle = trimmed;
      else chosen.add(index);
    }

    puzzle = puzzleFor();
    if (countRoutes(puzzle, 2) !== 1) continue;
    if (!isSolved(puzzle, solution)) continue;

    return { puzzle, solution };
  }

  throw new Error(`OneLine: no uniquely-solvable ${size}x${size} puzzle for seed ${seed}`);
}
