import React from 'react';
import { View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { PUZZLE_KINDS, type PuzzleKind } from '@/logic/daily';
import { todayKey } from '@/logic/dateKey';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

const LABELS: Record<PuzzleKind, 'puzzleRulers' | 'puzzleDuo' | 'puzzleOneLine'> = {
  rulers: 'puzzleRulers',
  duo: 'puzzleDuo',
  oneline: 'puzzleOneLine',
};

function Figure({ label, value }: { label: string; value: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        padding: spacing.base,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
      }}
    >
      <Text variant="numeric">{value}</Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const { colors, spacing } = useTheme();
  const progress = useProgressStore((s) => s.progress);
  const stats = useProgressStore((s) => s.stats)(todayKey());

  const empty = stats.puzzlesSolved === 0 && Object.keys(progress).length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll>
        {empty ? (
          <Text variant="body" tone="muted" style={{ marginTop: spacing['2xl'] }}>
            {t('noStatsYet')}
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.base }}>
              <Figure label={t('streakLabel')} value={String(stats.currentStreak)} />
              <Figure label={t('bestLabel')} value={String(stats.bestStreak)} />
              <Figure label={t('daysPlayed')} value={String(stats.daysPlayed)} />
              <Figure label={t('daysComplete')} value={String(stats.daysComplete)} />
            </View>

            <Text variant="micro" tone="faint" style={{ marginTop: spacing.xl }}>
              {t('puzzlesSolved')}
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {PUZZLE_KINDS.map((kind) => (
                <View
                  key={kind}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    minHeight: 44,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text variant="body">{t(LABELS[kind])}</Text>
                  <Text variant="bodyStrong">{String(stats.byKind[kind])}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Screen>
      <BannerAdSlot />
    </View>
  );
}
