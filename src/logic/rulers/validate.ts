/**
 * Rulers — region-constrained marker placement.
 *
 * Place exactly one marker in every row, every column and every coloured
 * region, and no two markers may touch, including diagonally. That last rule is
 * what separates this from plain N-queens: markers may share a diagonal at
 * distance, they simply may not be neighbours.
 *
 * Pure: no React, no React Native, no Expo. Every rule here is provable from
 * `npm test` without a simulator.
 */

export type RulersCell = 'empty' | 'marker' | 'crossed';
export type RulersBoard = RulersCell[][];

export interface RulersPuzzle {
  size: number;
  /** `regions[row][col]` is the region index, 0 … size-1. */
  regions: number[][];
}

export type ConflictReason = 'column' | 'region' | 'adjacent';

export interface Conflict {
  row: number;
  col: number;
  reason: ConflictReason;
}

/**
 * One column index per row, or -1 where the row has no single answer.
 *
 * A row holding two markers is reported as -1 rather than as its first marker:
 * it is genuinely unanswered, and treating it as answered would let an
 * over-filled board read as solved.
 */
export function markersOf(board: RulersBoard): number[] {
  return board.map((row) => {
    let found = -1;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] !== 'marker') continue;
      if (found !== -1) return -1;
      found = c;
    }
    return found;
  });
}

function touching(rowA: number, colA: number, rowB: number, colB: number): boolean {
  return Math.abs(rowA - rowB) <= 1 && Math.abs(colA - colB) <= 1;
}

/** Every rule violation on the board, including on a partially filled one. */
export function conflictsIn(puzzle: RulersPuzzle, board: RulersBoard): Conflict[] {
  const markers = markersOf(board);
  // Keyed by cell so a marker breaking three rules is still one highlight — a
  // cell listed three times would render as three overlapping error rings.
  const found = new Map<string, Conflict>();
  const flag = (row: number, col: number, reason: ConflictReason) => {
    const key = `${row},${col}`;
    if (!found.has(key)) found.set(key, { row, col, reason });
  };

  const placed = markers
    .map((col, row) => ({ row, col }))
    .filter((m) => m.col !== -1);

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i]!;
      const b = placed[j]!;
      if (a.col === b.col) {
        flag(a.row, a.col, 'column');
        flag(b.row, b.col, 'column');
      }
      if (puzzle.regions[a.row]?.[a.col] === puzzle.regions[b.row]?.[b.col]) {
        flag(a.row, a.col, 'region');
        flag(b.row, b.col, 'region');
      }
      if (touching(a.row, a.col, b.row, b.col)) {
        flag(a.row, a.col, 'adjacent');
        flag(b.row, b.col, 'adjacent');
      }
    }
  }

  return [...found.values()];
}

/** True only for a complete, fully legal placement. */
export function isSolved(puzzle: RulersPuzzle, board: RulersBoard): boolean {
  const markers = markersOf(board);
  if (markers.length !== puzzle.size) return false;
  if (markers.some((col) => col === -1)) return false;
  return conflictsIn(puzzle, board).length === 0;
}

/** An empty board of the puzzle's size. */
export function emptyBoard(size: number): RulersBoard {
  return Array.from({ length: size }, () => Array.from({ length: size }, (): RulersCell => 'empty'));
}
