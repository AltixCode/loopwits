import { makeRng, shuffled, type Rng } from '../rng';
import { countSolutions, findSolutions } from './solve';
import { emptyGrid, isSolved, type DuoGrid, type DuoLink, type DuoPuzzle } from './validate';

/**
 * Generates a Duo puzzle with exactly one solution.
 *
 * Backwards, like the other generators here: take a full legal grid, then
 * remove as much of it as the solver will still allow to be deduced.
 *
 *   1. solve an empty grid from a shuffled starting point — that is the answer;
 *   2. scatter a few `=` / `×` links, which carry information without showing
 *      a symbol and are what make the puzzle feel like deduction rather than
 *      sudoku;
 *   3. reveal cells one at a time until the puzzle is uniquely solvable, then
 *      take revealed cells back out again for as long as it stays unique.
 *
 * Step 3's second half is what separates an interesting puzzle from a tedious
 * one: the first uniquely-solvable set of givens is almost always far more than
 * the player needs.
 */

export interface GeneratedDuo {
  puzzle: DuoPuzzle;
  solution: DuoGrid;
}

/** A complete legal grid, found by solving from a randomised cell order. */
function randomSolution(size: number, rng: Rng): DuoGrid | null {
  // The solver is deterministic, so randomness has to come from the givens it
  // starts with: seed one random row and let it complete the rest.
  const given = emptyGrid(size);
  const half = size / 2;
  const row = shuffled(
    [...Array.from({ length: half }, () => 'sun' as const), ...Array.from({ length: half }, () => 'moon' as const)],
    rng,
  );
  const seedRow = rng.int(size);
  row.forEach((symbol, c) => {
    given[seedRow]![c] = symbol;
  });

  const solutions = findSolutions({ size, given, links: [] }, 1);
  return solutions[0] ?? null;
}

/** Links that the answer already satisfies, so they add information without lying. */
function linksFor(solution: DuoGrid, size: number, count: number, rng: Rng): DuoLink[] {
  const candidates: DuoLink[] = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const right = { r, c: c + 1 };
      const down = { r: r + 1, c };
      for (const b of [right, down]) {
        if (b.r >= size || b.c >= size) continue;
        const a = solution[r]![c]!;
        const other = solution[b.r]![b.c]!;
        candidates.push({ a: { r, c }, b, kind: a === other ? 'equal' : 'opposite' });
      }
    }
  }
  return shuffled(candidates, rng).slice(0, count);
}

export function generateDuo(size: number, seed: number): GeneratedDuo {
  if (size % 2 !== 0) throw new Error(`Duo needs an even size, got ${size}`);
  const rng = makeRng(seed);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const solution = randomSolution(size, rng);
    if (!solution) continue;

    const links = linksFor(solution, size, Math.max(2, Math.floor(size / 2)), rng);
    const given = emptyGrid(size);
    const puzzle: DuoPuzzle = { size, given, links };

    const cells = shuffled(
      Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size })),
      rng,
    );

    // Reveal until it is pinned down.
    let unique = countSolutions(puzzle, 2) === 1;
    for (const cell of cells) {
      if (unique) break;
      given[cell.r]![cell.c] = solution[cell.r]![cell.c]!;
      unique = countSolutions(puzzle, 2) === 1;
    }
    if (!unique) continue;

    // Then take back everything the player can still deduce without.
    for (const cell of shuffled(cells, rng)) {
      const value = given[cell.r]![cell.c];
      if (!value) continue;
      given[cell.r]![cell.c] = null;
      if (countSolutions(puzzle, 2) !== 1) given[cell.r]![cell.c] = value;
    }

    // The surviving answer must be the one we built the clues from.
    const only = findSolutions(puzzle, 2);
    if (only.length !== 1) continue;
    if (!isSolved(puzzle, solution)) continue;
    if (JSON.stringify(only[0]) !== JSON.stringify(solution)) continue;

    return { puzzle, solution };
  }

  throw new Error(`Duo: no uniquely-solvable ${size}x${size} puzzle for seed ${seed}`);
}
