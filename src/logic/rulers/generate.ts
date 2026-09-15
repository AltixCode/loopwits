import { makeRng, shuffled, type Rng } from '../rng';
import { countSolutions, findSolutions } from './solve';
import type { RulersPuzzle } from './validate';

/**
 * Generates a Rulers puzzle with exactly one solution.
 *
 * Working forwards — draw a region map, then hope it has one answer — almost
 * never lands. So it works backwards, the same generate-then-verify shape the
 * rest of the portfolio's puzzle generators use:
 *
 *   1. place a legal set of markers (one per row and column, none touching);
 *   2. grow `size` contiguous regions outwards from those markers, so each
 *      region contains exactly one by construction;
 *   3. reject the whole attempt unless the solver proves the answer unique.
 *
 * Step 3 is the one that matters. A puzzle with two answers is this genre's
 * defining defect: the player deduces correctly, is told they are wrong, and
 * stops trusting the app.
 */

export interface GeneratedRulers {
  puzzle: RulersPuzzle;
  /** The intended answer, as one column index per row. */
  solution: number[];
}

/** A legal marker placement, or null if this random attempt painted itself into a corner. */
function placeMarkers(size: number, rng: Rng): number[] | null {
  const placed: number[] = [];

  const step = (row: number): boolean => {
    if (row === size) return true;
    for (const col of shuffled(Array.from({ length: size }, (_, i) => i), rng)) {
      if (placed.includes(col)) continue;
      const previous = placed[row - 1];
      if (previous !== undefined && Math.abs(previous - col) <= 1) continue;
      placed.push(col);
      if (step(row + 1)) return true;
      placed.pop();
    }
    return false;
  };

  return step(0) ? placed : null;
}

/**
 * Grows `size` contiguous regions, one seeded at each marker.
 *
 * The region picked to grow each step is chosen at random rather than in
 * rotation, which is the whole trick. Round-robin growth produces regions of
 * near-equal size, and an even region map barely constrains anything: almost
 * every one admits several answers, so the uniqueness check rejects attempt
 * after attempt and generation never terminates. Uneven regions — some long and
 * thin, some fat — are what make the deduction tight enough to have one answer.
 */
function growRegions(size: number, markers: number[], rng: Rng): number[][] {
  const regions: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => -1),
  );
  const frontiers: { r: number; c: number }[][] = markers.map((col, row) => {
    regions[row]![col] = row;
    return [{ r: row, c: col }];
  });

  const freeNeighbours = (cell: { r: number; c: number }) =>
    [
      { r: cell.r + 1, c: cell.c },
      { r: cell.r - 1, c: cell.c },
      { r: cell.r, c: cell.c + 1 },
      { r: cell.r, c: cell.c - 1 },
    ].filter((n) => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && regions[n.r]![n.c] === -1);

  let remaining = size * size - size;
  let live = Array.from({ length: size }, (_, i) => i);

  while (remaining > 0 && live.length > 0) {
    const region = live[rng.int(live.length)]!;
    const frontier = frontiers[region]!;

    let claimed = false;
    for (const index of shuffled(frontier.map((_, i) => i), rng)) {
      const next = freeNeighbours(frontier[index]!)[0];
      if (!next) continue;
      regions[next.r]![next.c] = region;
      frontier.push(next);
      remaining -= 1;
      claimed = true;
      break;
    }

    if (!claimed) {
      // Walled in: drop it so the loop cannot spin on a region with nowhere to go.
      frontiers[region] = frontier.filter((cell) => freeNeighbours(cell).length > 0);
      if (frontiers[region]!.length === 0) live = live.filter((r) => r !== region);
    }
  }

  return regions;
}

/** Cells no region reached, handed to whichever neighbour already owns one. */
function fillStragglers(regions: number[][], size: number): boolean {
  for (let pass = 0; pass < size * size; pass += 1) {
    let open = 0;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (regions[r]![c] !== -1) continue;
        const owner = [
          regions[r + 1]?.[c],
          regions[r - 1]?.[c],
          regions[r]![c + 1],
          regions[r]![c - 1],
        ].find((value) => value !== undefined && value !== -1);
        if (owner === undefined) open += 1;
        else regions[r]![c] = owner;
      }
    }
    if (open === 0) break;
  }
  return regions.every((row) => row.every((value) => value !== -1));
}

/** True when every cell of `region` is still reachable from every other. */
function regionContiguous(regions: number[][], size: number, region: number): boolean {
  const cells: { r: number; c: number }[] = [];
  regions.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value === region) cells.push({ r, c });
    }),
  );
  if (cells.length === 0) return false;
  const seen = new Set([`${cells[0]!.r},${cells[0]!.c}`]);
  const queue = [cells[0]!];
  while (queue.length) {
    const { r, c } = queue.shift()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (regions[nr]?.[nc] === region && !seen.has(key)) {
        seen.add(key);
        queue.push({ r: nr, c: nc });
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Edits the region map so one rival solution becomes illegal, leaving the
 * intended one untouched.
 *
 * Rejection sampling alone is hopeless here — barely one region map in eight is
 * uniquely solvable at 7x7, so generation would spin for thousands of attempts.
 * Repair is cheap and targeted instead: take a cell where the rival places a
 * marker and the intended answer does not, and move that cell into a region
 * where the rival ALREADY has a marker. The rival then holds two markers in one
 * region and is dead. The intended answer cannot be harmed, because moving a
 * cell that holds none of its markers never changes which region its markers
 * are in.
 *
 * Returns true when a legal edit was made — legal meaning both affected regions
 * stay contiguous, which is what keeps the map readable.
 */
function killRival(
  regions: number[][],
  size: number,
  intended: number[],
  rival: number[],
  rng: Rng,
): boolean {
  const differing = shuffled(
    Array.from({ length: size }, (_, row) => row).filter((row) => rival[row] !== intended[row]),
    rng,
  );

  for (const row of differing) {
    const col = rival[row]!;
    // Never move a cell the intended answer marks: that would change which
    // region its marker lives in and could invalidate the answer itself.
    if (intended[row] === col) continue;
    const from = regions[row]![col]!;

    for (const otherRow of shuffled(
      Array.from({ length: size }, (_, r) => r).filter((r) => r !== row),
      rng,
    )) {
      const to = regions[otherRow]![rival[otherRow]!]!;
      if (to === from) continue;
      // Contiguity of the receiving region requires the cell to touch it.
      const touches = [
        regions[row + 1]?.[col],
        regions[row - 1]?.[col],
        regions[row]![col + 1],
        regions[row]![col - 1],
      ].includes(to);
      if (!touches) continue;

      regions[row]![col] = to;
      if (regionContiguous(regions, size, from) && regionContiguous(regions, size, to)) return true;
      regions[row]![col] = from;
    }
  }
  return false;
}

/**
 * A uniquely-solvable puzzle for `size` and `seed`.
 *
 * Deterministic: the same seed always returns the same puzzle, which is what
 * lets a date map to a puzzle with no server and no stored content.
 */
export function generateRulers(size: number, seed: number): GeneratedRulers {
  const rng = makeRng(seed);

  // Bounded rather than `while (true)`: a generator that cannot satisfy its own
  // constraints must fail loudly at build time, not hang the app.
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const markers = placeMarkers(size, rng);
    if (!markers) continue;

    const regions = growRegions(size, markers, rng);
    if (!fillStragglers(regions, size)) continue;

    const puzzle: RulersPuzzle = { size, regions };

    // Repair rather than reject: each pass removes one rival answer, and the
    // budget is generous because each pass is a solver call, not a regeneration.
    for (let repair = 0; repair < size * size; repair += 1) {
      const solutions = findSolutions(puzzle, 2);
      if (solutions.length === 0) break;
      if (solutions.length === 1) {
        // The surviving answer is the intended one as long as the repairs never
        // touched a marker cell — assert it rather than assume it.
        const only = solutions[0]!;
        if (only.every((col, row) => col === markers[row])) return { puzzle, solution: markers };
        break;
      }
      const rival = solutions.find((s) => !s.every((col, row) => col === markers[row]));
      if (!rival || !killRival(regions, size, markers, rival, rng)) break;
    }
  }

  throw new Error(`Rulers: no uniquely-solvable ${size}x${size} puzzle for seed ${seed}`);
}
