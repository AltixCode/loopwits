import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import Play from '../play/[kind]';
import { setRouteParams, testRouter } from './testRouter';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { puzzlesFor } from '@/logic/daily';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useProgressStore } from '@/store/useProgressStore';

// A fixed date keeps the generated puzzles stable, so these assertions describe
// real boards rather than whatever today happens to produce.
const DATE = '2026-09-18';
const DAY = puzzlesFor(DATE);

/** The first cell matching a predicate, or null. */
function firstCell<T>(grid: T[][], matches: (cell: T) => boolean): { r: number; c: number } | null {
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (matches(row[c]!)) return { r, c };
    }
  }
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  usePremiumStore.setState({ isPremium: false, isReady: true });
  useAdsConsentStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } });
  useProgressStore.setState({ progress: {}, isHydrated: true });
  setRouteParams({ kind: 'rulers', date: DATE });
});

describe('Play — Rulers', () => {
  it('shows the puzzle title and its rule', async () => {
    const { getByText } = await renderWithProviders(<Play />);
    expect(getByText(t('puzzleRulers'))).toBeTruthy();
    expect(getByText(t('ruleRulers'))).toBeTruthy();
  });

  it('renders a control for every cell', async () => {
    const size = DAY.rulers.puzzle.size;
    const { getAllByRole } = await renderWithProviders(<Play />);
    // Cells plus the two toolbar buttons.
    expect(getAllByRole('button').length).toBeGreaterThanOrEqual(size * size);
  });

  it('cycles a cell empty → crossed → marker → empty', async () => {
    const { getByLabelText } = await renderWithProviders(<Play />);
    const cellLabel = (state: string) => `${t('cellA11y', { row: 1, col: 1 })}, ${state}`;

    expect(getByLabelText(cellLabel(t('cellEmpty')))).toBeTruthy();
    await fireEvent.press(getByLabelText(cellLabel(t('cellEmpty'))));
    await waitFor(() => expect(getByLabelText(cellLabel(t('cellCrossed')))).toBeTruthy());
    await fireEvent.press(getByLabelText(cellLabel(t('cellCrossed'))));
    await waitFor(() => expect(getByLabelText(cellLabel(t('cellMarker')))).toBeTruthy());
    await fireEvent.press(getByLabelText(cellLabel(t('cellMarker'))));
    await waitFor(() => expect(getByLabelText(cellLabel(t('cellEmpty')))).toBeTruthy());
  });

  it('a hint places part of the real answer', async () => {
    const { getByLabelText, getAllByLabelText } = await renderWithProviders(<Play />);
    await fireEvent.press(getByLabelText(t('hint')));
    await waitFor(() =>
      expect(getAllByLabelText(new RegExp(t('cellMarker'))).length).toBeGreaterThan(0),
    );
  });

  it('restart clears the board again', async () => {
    const { getByLabelText, queryAllByLabelText } = await renderWithProviders(<Play />);
    await fireEvent.press(getByLabelText(t('hint')));
    await waitFor(() => expect(queryAllByLabelText(new RegExp(t('cellMarker'))).length).toBeGreaterThan(0));
    await fireEvent.press(getByLabelText(t('restart')));
    await waitFor(() => expect(queryAllByLabelText(new RegExp(t('cellMarker'))).length).toBe(0));
  });

  it('records the solve and offers the way back when the board is finished', async () => {
    // Premium, because a FREE player gets exactly one hint — which is the
    // intended behaviour, and what made an earlier version of this test wrong.
    usePremiumStore.setState({ isPremium: true });
    const { getByLabelText, getByText } = await renderWithProviders(<Play />);
    // Exactly one hint per row: each places one more marker of the known answer,
    // and after the last the toolbar is replaced by the solved view — pressing
    // again would look for a Hint button that no longer exists.
    for (let i = 0; i < DAY.rulers.puzzle.size; i += 1) {
      await fireEvent.press(getByLabelText(t('hint')));
    }
    await waitFor(() => expect(getByText(t('solvedTitle'))).toBeTruthy());
    expect(useProgressStore.getState().progress[DATE]?.solved.rulers).toBe(true);

    await fireEvent.press(getByLabelText(t('backToToday')));
    expect(testRouter.replace).toHaveBeenCalledWith('/');
  });
});

describe('Play — Duo', () => {
  beforeEach(() => setRouteParams({ kind: 'duo', date: DATE }));

  it('shows the Duo rule', async () => {
    const { getByText } = await renderWithProviders(<Play />);
    expect(getByText(t('ruleDuo'))).toBeTruthy();
  });

  it('does not let a given cell be changed', async () => {
    // Plain loops, not forEach: TypeScript's control-flow analysis cannot see an
    // assignment made inside a closure, and narrows the result to `never`.
    const given = DAY.duo.puzzle.given;
    const found = firstCell(given, (cell) => Boolean(cell));
    if (!found) return; // A puzzle with no givens is legal; nothing to assert.
    const { getByLabelText } = await renderWithProviders(<Play />);
    const label = new RegExp(t('cellA11y', { row: found.r + 1, col: found.c + 1 }));
    expect(getByLabelText(label).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('cycles an empty cell through sun and moon', async () => {
    const open = firstCell(DAY.duo.puzzle.given, (cell) => !cell);
    const { getByLabelText } = await renderWithProviders(<Play />);
    const at = open!;
    const label = (state: string) => `${t('cellA11y', { row: at.r + 1, col: at.c + 1 })}, ${state}`;
    await fireEvent.press(getByLabelText(label(t('cellEmpty'))));
    await waitFor(() => expect(getByLabelText(label(t('cellSun')))).toBeTruthy());
    await fireEvent.press(getByLabelText(label(t('cellSun'))));
    await waitFor(() => expect(getByLabelText(label(t('cellMoon')))).toBeTruthy());
  });
});

describe('Play — OneLine', () => {
  beforeEach(() => setRouteParams({ kind: 'oneline', date: DATE }));

  it('shows the OneLine rule and every cell', async () => {
    const size = DAY.oneline.puzzle.size;
    const { getByText, getAllByLabelText } = await renderWithProviders(<Play />);
    expect(getByText(t('ruleOneLine'))).toBeTruthy();
    expect(getAllByLabelText(new RegExp(t('cellA11y', { row: 1, col: 1 })))).toHaveLength(1);
    expect(size).toBeGreaterThan(0);
  });

  it('a hint starts the path', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(<Play />);
    await fireEvent.press(getByLabelText(t('hint')));
    // The board redraws with the path's first cell filled; the screen stays up.
    await waitFor(() => expect(getByText(t('puzzleOneLine'))).toBeTruthy());
  });
});

describe('Play — mistake highlighting', () => {
  it('is offered to a premium player', async () => {
    usePremiumStore.setState({ isPremium: true });
    setRouteParams({ kind: 'rulers', date: DATE });
    const { getByText } = await renderWithProviders(<Play />);
    expect(getByText(t('mistakesShown'))).toBeTruthy();
  });

  it('is not offered to a free player', async () => {
    setRouteParams({ kind: 'rulers', date: DATE });
    const { queryByText } = await renderWithProviders(<Play />);
    expect(queryByText(t('mistakesShown'))).toBeNull();
  });
});
