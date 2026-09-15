/**
 * Duo — a binary-grid puzzle.
 *
 * Fill every cell with a sun or a moon so that:
 *  - each row and each column holds equally many of each,
 *  - no three of the same symbol sit side by side,
 *  - every `=` link joins two equal neighbours and every `×` link two opposites,
 *  - the puzzle's given cells are respected.
 *
 * Pure: no React, no React Native, no Expo.
 */

export type DuoSymbol = 'sun' | 'moon';
export type DuoCell = DuoSymbol | null;
export type DuoGrid = DuoCell[][];

export type LinkKind = 'equal' | 'opposite';

export interface DuoLink {
  a: { r: number; c: number };
  b: { r: number; c: number };
  kind: LinkKind;
}

export interface DuoPuzzle {
  size: number;
  /** Cells fixed by the puzzle; `null` where the player must decide. */
  given: DuoGrid;
  links: DuoLink[];
}

export type DuoConflictReason = 'triple' | 'balance' | 'link' | 'given';

export interface DuoConflict {
  row: number;
  col: number;
  reason: DuoConflictReason;
}

export function emptyGrid(size: number): DuoGrid {
  return Array.from({ length: size }, () => Array.from({ length: size }, (): DuoCell => null));
}

const opposite = (symbol: DuoSymbol): DuoSymbol => (symbol === 'sun' ? 'moon' : 'sun');

function lineOf(grid: DuoGrid, index: number, axis: 'row' | 'col'): DuoCell[] {
  return axis === 'row'
    ? [...(grid[index] ?? [])]
    : grid.map((row) => row[index] ?? null);
}

/**
 * Every rule violation, including on a partly filled grid.
 *
 * "Balance" is reported as soon as one symbol exceeds half the line, not only
 * when the line is full: at that point the line is already unsolvable, and
 * saying so early is the difference between a hint and a post-mortem.
 */
export function conflictsIn(puzzle: DuoPuzzle, grid: DuoGrid): DuoConflict[] {
  const { size } = puzzle;
  const found = new Map<string, DuoConflict>();
  const flag = (row: number, col: number, reason: DuoConflictReason) => {
    const key = `${row},${col}`;
    if (!found.has(key)) found.set(key, { row, col, reason });
  };

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const fixed = puzzle.given[r]?.[c];
      const actual = grid[r]?.[c];
      if (fixed && actual && fixed !== actual) flag(r, c, 'given');
    }
  }

  for (const axis of ['row', 'col'] as const) {
    for (let i = 0; i < size; i += 1) {
      const line = lineOf(grid, i, axis);
      const at = (j: number) => (axis === 'row' ? { row: i, col: j } : { row: j, col: i });

      for (let j = 0; j + 2 < size; j += 1) {
        const a = line[j];
        if (a && a === line[j + 1] && a === line[j + 2]) {
          [j, j + 1, j + 2].forEach((k) => {
            const { row, col } = at(k);
            flag(row, col, 'triple');
          });
        }
      }

      const half = size / 2;
      for (const symbol of ['sun', 'moon'] as const) {
        const positions = line
          .map((cell, j) => (cell === symbol ? j : -1))
          .filter((j) => j !== -1);
        if (positions.length > half) {
          positions.forEach((j) => {
            const { row, col } = at(j);
            flag(row, col, 'balance');
          });
        }
      }
    }
  }

  for (const link of puzzle.links) {
    const a = grid[link.a.r]?.[link.a.c];
    const b = grid[link.b.r]?.[link.b.c];
    if (!a || !b) continue;
    const ok = link.kind === 'equal' ? a === b : a === opposite(b);
    if (!ok) {
      flag(link.a.r, link.a.c, 'link');
      flag(link.b.r, link.b.c, 'link');
    }
  }

  return [...found.values()];
}

/** True only for a complete, fully legal grid. */
export function isSolved(puzzle: DuoPuzzle, grid: DuoGrid): boolean {
  const { size } = puzzle;
  if (grid.length !== size) return false;
  if (grid.some((row) => row.length !== size || row.some((cell) => cell === null))) return false;
  return conflictsIn(puzzle, grid).length === 0;
}
