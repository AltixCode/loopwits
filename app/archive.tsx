import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { addDays, todayKey } from '@/logic/dateKey';
import { FREE_ARCHIVE_DAYS, canPlay, solvedCount } from '@/logic/progress';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

/** Two weeks back: enough to show the free window and what the unlock adds. */
const VISIBLE_DAYS = 21;

export default function Archive() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const today = todayKey();
  const progress = useProgressStore((s) => s.progress);
  const isPremium = usePremiumStore((s) => s.isPremium);

  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(today, -i));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll>
        {!isPremium ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('archiveLocked')}
            onPress={() => router.push('/paywall')}
            style={{
              marginTop: spacing.base,
              padding: spacing.base,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text variant="bodyStrong" tone="accent">
              {t('archiveLocked')}
            </Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {t('archiveFreeWindow', { count: FREE_ARCHIVE_DAYS })}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {days.map((key) => {
            const playable = canPlay(key, today, isPremium);
            const done = solvedCount(progress[key]);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${key} — ${t('progressOfThree', { count: done })}`}
                accessibilityState={{ disabled: !playable }}
                onPress={() => (playable ? router.push(`/play/rulers?date=${key}`) : router.push('/paywall'))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 52,
                  paddingHorizontal: spacing.base,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text variant="body">{key}</Text>
                {/* The PRO badge is what marks a locked day, so it is the one
                    thing that must not be faint. Dimming the whole row to 0.5
                    took the date to 3.64:1 and the badge to 2.19:1 -- the row
                    said "locked" in the least legible way available. */}
                <Text
                  variant="caption"
                  tone={!playable || done === 3 ? 'accent' : 'muted'}
                >
                  {playable ? t('progressOfThree', { count: done }) : t('proBadge')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Screen>
      <BannerAdSlot />
    </View>
  );
}
