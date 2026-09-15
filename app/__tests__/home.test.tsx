import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import Home from '../index';
import { testRouter } from './testRouter';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { todayKey } from '@/logic/dateKey';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useProgressStore } from '@/store/useProgressStore';

const TODAY = todayKey();
const full = { solved: { rulers: true, duo: true, oneline: true } };

// One test replaces `hydrate` to hold the screen in its loading state. Zustand
// state is module-level, so the stub would leak into every later test unless
// the real implementation is put back each time.
const realHydrate = useProgressStore.getState().hydrate;

/**
 * Home hydrates from storage on mount, so seeding the store directly is
 * pointless — `hydrate()` overwrites it a tick later. Seed the store the app
 * actually reads.
 */
async function seed(progress: Record<string, unknown>) {
  await AsyncStorage.setItem('loopwits.progress.v1', JSON.stringify(progress));
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  usePremiumStore.setState({ isPremium: false, isReady: true });
  useAdsConsentStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } });
  useProgressStore.setState({ progress: {}, isHydrated: false, hydrate: realHydrate });
});

// No jest.restoreAllMocks(): it restores every spy in the process, including
// ones the renderer relies on, and the next test's tree is torn down on render.

describe('Home', () => {
  it('shows today and the three puzzles', async () => {
    const { getByText } = await renderWithProviders(<Home />);
    expect(getByText(t('todayTitle'))).toBeTruthy();
    expect(getByText(t('puzzleRulers'))).toBeTruthy();
    expect(getByText(t('puzzleDuo'))).toBeTruthy();
    expect(getByText(t('puzzleOneLine'))).toBeTruthy();
  });

  it('reports how many of the three are solved', async () => {
    await seed({ [TODAY]: { solved: { duo: true } } });
    const { getByText } = await renderWithProviders(<Home />);
    await waitFor(() => expect(getByText(t('progressOfThree', { count: 1 }))).toBeTruthy());
  });

  it('opens a puzzle with today’s date', async () => {
    const { getByText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('puzzleDuo')));
    expect(testRouter.push).toHaveBeenCalledWith(`/play/duo?date=${TODAY}`);
  });

  it('does not celebrate a day that is not finished', async () => {
    await seed({ [TODAY]: { solved: { duo: true } } });
    const { queryByText, getByText } = await renderWithProviders(<Home />);
    await waitFor(() => expect(getByText(t('progressOfThree', { count: 1 }))).toBeTruthy());
    expect(queryByText(t('allDoneTitle'))).toBeNull();
  });

  it('celebrates once all three are done', async () => {
    await seed({ [TODAY]: full });
    const { getByText } = await renderWithProviders(<Home />);
    await waitFor(() => expect(getByText(t('allDoneTitle'))).toBeTruthy());
  });

  it('shows a dash instead of a zero streak until progress has loaded', async () => {
    // A player on a 40-day run must never be shown "0", even for one frame.
    const hydrate = jest.fn().mockImplementation(() => new Promise<void>(() => {}));
    useProgressStore.setState({ progress: {}, isHydrated: false, hydrate });
    const { getByText } = await renderWithProviders(<Home />);
    expect(getByText('—')).toBeTruthy();
  });

  it('shows the streak once progress has loaded', async () => {
    await seed({ [TODAY]: full });
    const { getByText } = await renderWithProviders(<Home />);
    await waitFor(() => expect(getByText('1')).toBeTruthy());
  });

  it('routes to the archive, stats and settings', async () => {
    const { getByLabelText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByLabelText(t('archiveTitle')));
    await fireEvent.press(getByLabelText(t('statsTitle')));
    await fireEvent.press(getByLabelText(t('settingsTitle')));
    expect(testRouter.push).toHaveBeenCalledWith('/archive');
    expect(testRouter.push).toHaveBeenCalledWith('/stats');
    expect(testRouter.push).toHaveBeenCalledWith('/settings');
  });

  it('shows a banner to a free user and none to a premium one', async () => {
    const free = await renderWithProviders(<Home />);
    expect(free.queryByTestId('banner-ad')).not.toBeNull();

    usePremiumStore.setState({ isPremium: true });
    const paid = await renderWithProviders(<Home />);
    expect(paid.queryByTestId('banner-ad')).toBeNull();
  });
});
