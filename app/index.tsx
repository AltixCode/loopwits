import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { PUZZLE_KINDS, type PuzzleKind } from '@/logic/daily';
import { todayKey } from '@/logic/dateKey';
import { currentStreak, isDayComplete, solvedCount } from '@/logic/progress';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

const LABELS: Record<PuzzleKind, 'puzzleRulers' | 'puzzleDuo' | 'puzzleOneLine'> = {
  rulers: 'puzzleRulers',
  duo: 'puzzleDuo',
  oneline: 'puzzleOneLine',
};

const RULES: Record<PuzzleKind, 'ruleRulers' | 'ruleDuo' | 'ruleOneLine'> = {
  rulers: 'ruleRulers',
  duo: 'ruleDuo',
  oneline: 'ruleOneLine',
};

function PuzzleRow({ kind, solved, onPress }: { kind: PuzzleKind; solved: boolean; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(LABELS[kind])} — ${solved ? t('statusSolved') : t('statusNotStarted')}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        minHeight: 72,
        padding: spacing.base,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: solved ? colors.accent : colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: solved ? colors.accent : colors.surfaceAlt,
        }}
      >
        <Text variant="bodyStrong" color={solved ? colors.onAccent : colors.textMuted}>
          {solved ? '✓' : '·'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{t(LABELS[kind])}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
          {t(RULES[kind])}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const today = todayKey();

  const progress = useProgressStore((s) => s.progress);
  const isHydrated = useProgressStore((s) => s.isHydrated);
  const hydrate = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const day = progress[today];
  const done = solvedCount(day);
  // The streak is only meaningful once saved progress has been read; showing a
  // zero first would tell a player on a 40-day run that they had lost it.
  const streak = isHydrated ? currentStreak(progress, today) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll topInset>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: spacing['2xl'],
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="display">{t('todayTitle')}</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
              {t('progressOfThree', { count: done })}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('statsTitle')}
            onPress={() => router.push('/stats')}
            style={{
              alignItems: 'center',
              minWidth: 64,
              minHeight: 44,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          >
            <Text variant="bodyStrong">{streak === null ? '—' : String(streak)}</Text>
            <Text variant="micro" tone="faint">
              {t('streakLabel')}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {PUZZLE_KINDS.map((kind) => (
            <PuzzleRow
              key={kind}
              kind={kind}
              solved={Boolean(day?.solved[kind])}
              onPress={() => router.push(`/play/${kind}?date=${today}`)}
            />
          ))}
        </View>

        {isDayComplete(day) ? (
          <View
            style={{
              marginTop: spacing.xl,
              padding: spacing.base,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
            }}
          >
            <Text variant="bodyStrong" tone="accent">
              {t('allDoneTitle')}
            </Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {t('allDoneBody')}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('archiveTitle')}
            onPress={() => router.push('/archive')}
            style={{
              flex: 1,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Text variant="callout">{t('archiveTitle')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settingsTitle')}
            onPress={() => router.push('/settings')}
            style={{
              flex: 1,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Text variant="callout">{t('settingsTitle')}</Text>
          </Pressable>
        </View>
      </Screen>
      <BannerAdSlot />
    </View>
  );
}
