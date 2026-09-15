/**
 * OneLine — draw one continuous path through every cell, visiting the numbered
 * dots 1…N in order.
 *
 * The path moves only between orthogonal neighbours, may not revisit a cell,
 * and must end having covered the whole grid. Pure: no React, no React Native.
 */

export interface Point {
  r: number;
  c: number;
}

export interface OneLinePuzzle {
  size: number;
  /** `dots[i]` is where the number `i + 1` sits. At least two, in visit order. */
  dots: Point[];
}

/** The player's path so far, from the first cell touched to the last. */
export type OneLinePath = Point[];

export type OneLineProblem =
  | 'not-adjacent'
  | 'revisits'
  | 'wrong-start'
  | 'dot-out-of-order'
  | 'incomplete';

export const samePoint = (a: Point, b: Point): boolean => a.r === b.r && a.c === b.c;

const adjacent = (a: Point, b: Point): boolean =>
  Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

const key = (p: Point): string => `${p.r},${p.c}`;

/**
 * What is wrong with the path, in the order a player would notice it.
 *
 * Returns an empty array for a legal *prefix* as well as for a finished path —
 * the drawing UI asks after every cell, so a partial path must not be called
 * broken.
 */
export function problemsWith(puzzle: OneLinePuzzle, path: OneLinePath): OneLineProblem[] {
  const problems: OneLineProblem[] = [];
  if (path.length === 0) return problems;

  const first = puzzle.dots[0];
  if (first && !samePoint(path[0]!, first)) problems.push('wrong-start');

  const seen = new Set<string>();
  for (let i = 0; i < path.length; i += 1) {
    const cell = path[i]!;
    if (cell.r < 0 || cell.r >= puzzle.size || cell.c < 0 || cell.c >= puzzle.size) {
      problems.push('revisits');
      break;
    }
    if (seen.has(key(cell))) {
      problems.push('revisits');
      break;
    }
    seen.add(key(cell));
    if (i > 0 && !adjacent(path[i - 1]!, cell)) {
      problems.push('not-adjacent');
      break;
    }
  }

  // Dots must be met in numeric order. Checking the order of those dots the
  // path has actually reached lets a half-drawn path stay valid.
  const reached = puzzle.dots
    .map((dot, index) => ({ index, at: path.findIndex((p) => samePoint(p, dot)) }))
    .filter((d) => d.at !== -1);
  for (let i = 1; i < reached.length; i += 1) {
    const previous = reached[i - 1]!;
    const current = reached[i]!;
    if (current.index < previous.index || current.at < previous.at) {
      problems.push('dot-out-of-order');
      break;
    }
  }
  // A skipped dot is only a problem once a later one has been reached.
  for (let i = 0; i < reached.length; i += 1) {
    if (reached[i]!.index !== i) {
      if (!problems.includes('dot-out-of-order')) problems.push('dot-out-of-order');
      break;
    }
  }

  return problems;
}

/** True only for a complete path: every cell once, every dot in order. */
export function isSolved(puzzle: OneLinePuzzle, path: OneLinePath): boolean {
  if (path.length !== puzzle.size * puzzle.size) return false;
  if (problemsWith(puzzle, path).length > 0) return false;
  const last = puzzle.dots[puzzle.dots.length - 1];
  return last ? samePoint(path[path.length - 1]!, last) : true;
}
