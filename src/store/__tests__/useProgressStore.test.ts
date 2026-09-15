import AsyncStorage from '@react-native-async-storage/async-storage';

import { useProgressStore } from '../useProgressStore';

const KEY = 'loopwits.progress.v1';

beforeEach(async () => {
  await AsyncStorage.clear();
  useProgressStore.getState().resetForTests();
  jest.restoreAllMocks();
});

describe('hydrate', () => {
  it('starts empty when nothing is saved', async () => {
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState()).toMatchObject({ progress: {}, isHydrated: true });
  });

  it('restores saved progress', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ '2026-09-15': { solved: { duo: true } } }));
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState().progress['2026-09-15']?.solved.duo).toBe(true);
  });

  it('survives a corrupt blob rather than throwing out of a render', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState()).toMatchObject({ progress: {}, isHydrated: true });
  });

  it('ignores a saved value of the wrong shape', async () => {
    await AsyncStorage.setItem(KEY, '["nope"]');
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState().progress).toEqual({});
  });

  it('becomes hydrated even when the store cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('locked'));
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState().isHydrated).toBe(true);
  });
});

describe('markSolved', () => {
  it('records a solve and persists it', async () => {
    useProgressStore.getState().markSolved('2026-09-15', 'rulers', 42);
    expect(useProgressStore.getState().progress['2026-09-15']?.solved.rulers).toBe(true);
    const raw = await AsyncStorage.getItem(KEY);
    expect(JSON.parse(raw!)['2026-09-15'].solved.rulers).toBe(true);
  });

  it('accumulates the three puzzles of a day', () => {
    const { markSolved } = useProgressStore.getState();
    markSolved('2026-09-15', 'rulers', 10);
    markSolved('2026-09-15', 'duo', 20);
    markSolved('2026-09-15', 'oneline', 30);
    expect(useProgressStore.getState().progress['2026-09-15']?.solved).toEqual({
      rulers: true,
      duo: true,
      oneline: true,
    });
  });

  it('keeps the faster time when a solved puzzle is replayed', () => {
    const { markSolved } = useProgressStore.getState();
    markSolved('2026-09-15', 'duo', 30);
    markSolved('2026-09-15', 'duo', 95);
    expect(useProgressStore.getState().progress['2026-09-15']?.seconds?.duo).toBe(30);
  });

  it('improves the time when the replay is faster', () => {
    const { markSolved } = useProgressStore.getState();
    markSolved('2026-09-15', 'duo', 95);
    markSolved('2026-09-15', 'duo', 30);
    expect(useProgressStore.getState().progress['2026-09-15']?.seconds?.duo).toBe(30);
  });

  it('keeps days separate', () => {
    const { markSolved } = useProgressStore.getState();
    markSolved('2026-09-14', 'duo', 10);
    markSolved('2026-09-15', 'duo', 10);
    expect(Object.keys(useProgressStore.getState().progress).sort()).toEqual([
      '2026-09-14',
      '2026-09-15',
    ]);
  });

  it('does not throw when persistence fails', () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    expect(() => useProgressStore.getState().markSolved('2026-09-15', 'duo', 5)).not.toThrow();
    expect(useProgressStore.getState().progress['2026-09-15']?.solved.duo).toBe(true);
  });
});

describe('stats', () => {
  it('summarises what has been solved', () => {
    const { markSolved } = useProgressStore.getState();
    markSolved('2026-09-15', 'rulers', 10);
    markSolved('2026-09-15', 'duo', 10);
    markSolved('2026-09-15', 'oneline', 10);
    const stats = useProgressStore.getState().stats('2026-09-15');
    expect(stats.daysComplete).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.puzzlesSolved).toBe(3);
  });
});
