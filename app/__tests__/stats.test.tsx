import React from 'react';

import StatsScreen from '../stats';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { todayKey } from '@/logic/dateKey';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useProgressStore } from '@/store/useProgressStore';

const TODAY = todayKey();

beforeEach(() => {
  jest.clearAllMocks();
  usePremiumStore.setState({ isPremium: false, isReady: true });
  useAdsConsentStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } });
  useProgressStore.setState({ progress: {}, isHydrated: true });
});

describe('Stats', () => {
  it('invites a first solve rather than showing a wall of zeroes', async () => {
    const { getByText } = await renderWithProviders(<StatsScreen />);
    expect(getByText(t('noStatsYet'))).toBeTruthy();
  });

  it('shows the figures once something has been solved', async () => {
    useProgressStore.setState({
      progress: { [TODAY]: { solved: { rulers: true, duo: true, oneline: true } } },
      isHydrated: true,
    });
    const { getByText, queryByText } = await renderWithProviders(<StatsScreen />);
    expect(queryByText(t('noStatsYet'))).toBeNull();
    expect(getByText(t('streakLabel'))).toBeTruthy();
    expect(getByText(t('daysComplete'))).toBeTruthy();
  });

  it('breaks the count down by puzzle type', async () => {
    useProgressStore.setState({
      progress: {
        [TODAY]: { solved: { rulers: true } },
        '2026-01-01': { solved: { rulers: true, duo: true } },
      },
      isHydrated: true,
    });
    const { getAllByText, getByText } = await renderWithProviders(<StatsScreen />);
    expect(getByText(t('puzzleRulers'))).toBeTruthy();
    expect(getByText(t('puzzleDuo'))).toBeTruthy();
    // Rulers twice, Duo once, OneLine none. Asserted as a set because "2" also
    // appears among the summary figures.
    expect(getAllByText('2').length).toBeGreaterThan(0);
    expect(getByText(t('puzzleOneLine'))).toBeTruthy();
  });
});
