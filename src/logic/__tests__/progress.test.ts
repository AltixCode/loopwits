import {
  ALL_KINDS,
  FREE_ARCHIVE_DAYS,
  bestStreak,
  canPlay,
  currentStreak,
  isDayComplete,
  solvedCount,
  statsFrom,
  type ProgressMap,
} from '../progress';

const full = { solved: { rulers: true, duo: true, oneline: true } };
const partial = { solved: { rulers: true } };

describe('solvedCount / isDayComplete', () => {
  it('counts nothing for a day never opened', () => {
    expect(solvedCount(undefined)).toBe(0);
    expect(isDayComplete(undefined)).toBe(false);
  });

  it('counts each solved puzzle', () => {
    expect(solvedCount(partial)).toBe(1);
    expect(solvedCount({ solved: { rulers: true, duo: true } })).toBe(2);
    expect(solvedCount(full)).toBe(3);
  });

  it('is complete only when all three are solved', () => {
    expect(isDayComplete(partial)).toBe(false);
    expect(isDayComplete({ solved: { rulers: true, duo: true } })).toBe(false);
    expect(isDayComplete(full)).toBe(true);
  });

  it('ignores a false flag rather than counting the key', () => {
    expect(solvedCount({ solved: { rulers: true, duo: false } })).toBe(1);
  });
});

describe('currentStreak', () => {
  it('is zero with no history', () => {
    expect(currentStreak({}, '2026-09-15')).toBe(0);
  });

  it('counts consecutive complete days ending today', () => {
    const progress: ProgressMap = {
      '2026-09-13': full,
      '2026-09-14': full,
      '2026-09-15': full,
    };
    expect(currentStreak(progress, '2026-09-15')).toBe(3);
  });

  it('does NOT break because today is unfinished — the day is still running', () => {
    // Counting from an incomplete today would show a player their streak had
    // reset at breakfast: wrong, and the most demoralising bug a daily game has.
    const progress: ProgressMap = {
      '2026-09-13': full,
      '2026-09-14': full,
      '2026-09-15': partial,
    };
    expect(currentStreak(progress, '2026-09-15')).toBe(2);
  });

  it('is zero when today is unfinished and yesterday was missed', () => {
    expect(currentStreak({ '2026-09-13': full }, '2026-09-15')).toBe(0);
  });

  it('breaks on a gap', () => {
    const progress: ProgressMap = {
      '2026-09-11': full,
      '2026-09-12': full,
      '2026-09-14': full,
      '2026-09-15': full,
    };
    expect(currentStreak(progress, '2026-09-15')).toBe(2);
  });

  it('counts across a month boundary', () => {
    const progress: ProgressMap = {
      '2026-08-30': full,
      '2026-08-31': full,
      '2026-09-01': full,
    };
    expect(currentStreak(progress, '2026-09-01')).toBe(3);
  });

  it('counts across a DST boundary', () => {
    const progress: ProgressMap = {
      '2026-10-24': full,
      '2026-10-25': full,
      '2026-10-26': full,
    };
    expect(currentStreak(progress, '2026-10-26')).toBe(3);
  });
});

describe('bestStreak', () => {
  it('is zero with no history', () => {
    expect(bestStreak({})).toBe(0);
  });

  it('finds the longest run, not the most recent', () => {
    const progress: ProgressMap = {
      '2026-09-01': full,
      '2026-09-02': full,
      '2026-09-03': full,
      '2026-09-04': full,
      '2026-09-10': full,
    };
    expect(bestStreak(progress)).toBe(4);
  });

  it('ignores incomplete days when joining a run', () => {
    const progress: ProgressMap = {
      '2026-09-01': full,
      '2026-09-02': partial,
      '2026-09-03': full,
    };
    expect(bestStreak(progress)).toBe(1);
  });

  it('counts a single complete day as one', () => {
    expect(bestStreak({ '2026-09-01': full })).toBe(1);
  });
});

describe('statsFrom', () => {
  it('summarises an empty history', () => {
    expect(statsFrom({}, '2026-09-15')).toEqual({
      daysPlayed: 0,
      daysComplete: 0,
      puzzlesSolved: 0,
      currentStreak: 0,
      bestStreak: 0,
      byKind: { rulers: 0, duo: 0, oneline: 0 },
    });
  });

  it('counts days played, days complete and puzzles by kind', () => {
    const progress: ProgressMap = {
      '2026-09-14': full,
      '2026-09-15': { solved: { rulers: true, oneline: true } },
    };
    const stats = statsFrom(progress, '2026-09-15');
    expect(stats.daysPlayed).toBe(2);
    expect(stats.daysComplete).toBe(1);
    expect(stats.puzzlesSolved).toBe(5);
    expect(stats.byKind).toEqual({ rulers: 2, duo: 1, oneline: 2 });
    expect(stats.currentStreak).toBe(1);
  });

  it('does not count a day that was opened but never solved as played', () => {
    expect(statsFrom({ '2026-09-15': { solved: {} } }, '2026-09-15').daysPlayed).toBe(0);
  });
});

describe('canPlay', () => {
  it('always allows today', () => {
    expect(canPlay('2026-09-15', '2026-09-15', false)).toBe(true);
  });

  it('never allows a future day, even for Pro', () => {
    // Tomorrow's puzzle is derivable from the seed; letting it be played would
    // let a determined player bank a streak in advance.
    expect(canPlay('2026-09-16', '2026-09-15', true)).toBe(false);
  });

  it('allows a free user the last seven days', () => {
    expect(canPlay('2026-09-09', '2026-09-15', false)).toBe(true);
    expect(canPlay('2026-09-08', '2026-09-15', false)).toBe(false);
  });

  it('lets Pro reach back indefinitely', () => {
    expect(canPlay('2025-01-01', '2026-09-15', true)).toBe(true);
  });

  it('gates exactly at the documented boundary', () => {
    expect(FREE_ARCHIVE_DAYS).toBe(7);
    expect(ALL_KINDS).toEqual(['rulers', 'duo', 'oneline']);
  });
});
