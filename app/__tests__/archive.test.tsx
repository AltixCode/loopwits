import { fireEvent } from '@testing-library/react-native';
import React from 'react';

import Archive from '../archive';
import { testRouter } from './testRouter';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { addDays, todayKey } from '@/logic/dateKey';
import { FREE_ARCHIVE_DAYS } from '@/logic/progress';
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

describe('Archive', () => {
  it('tells a free user where the free window ends', async () => {
    const { getByText } = await renderWithProviders(<Archive />);
    expect(getByText(t('archiveLocked'))).toBeTruthy();
    expect(getByText(t('archiveFreeWindow', { count: FREE_ARCHIVE_DAYS }))).toBeTruthy();
  });

  it('does not sell the archive to someone who already owns it', async () => {
    usePremiumStore.setState({ isPremium: true });
    const { queryByText } = await renderWithProviders(<Archive />);
    expect(queryByText(t('archiveLocked'))).toBeNull();
  });

  it('opens a day inside the free window', async () => {
    const recent = addDays(TODAY, -2);
    const { getByLabelText } = await renderWithProviders(<Archive />);
    await fireEvent.press(getByLabelText(new RegExp(`^${recent}`)));
    expect(testRouter.push).toHaveBeenCalledWith(`/play/rulers?date=${recent}`);
  });

  it('sends a free user to the paywall for a day beyond the window', async () => {
    const old = addDays(TODAY, -FREE_ARCHIVE_DAYS - 1);
    const { getByLabelText } = await renderWithProviders(<Archive />);
    await fireEvent.press(getByLabelText(new RegExp(`^${old}`)));
    expect(testRouter.push).toHaveBeenCalledWith('/paywall');
  });

  it('opens an old day for a premium user instead of selling again', async () => {
    usePremiumStore.setState({ isPremium: true });
    const old = addDays(TODAY, -FREE_ARCHIVE_DAYS - 1);
    const { getByLabelText } = await renderWithProviders(<Archive />);
    await fireEvent.press(getByLabelText(new RegExp(`^${old}`)));
    expect(testRouter.push).toHaveBeenCalledWith(`/play/rulers?date=${old}`);
  });
});
