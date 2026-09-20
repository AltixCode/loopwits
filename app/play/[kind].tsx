import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { DuoBoard } from '@/components/game/DuoBoard';
import { OneLineBoard } from '@/components/game/OneLineBoard';
import { RulersBoard } from '@/components/game/RulersBoard';
import { Button, IconButton, Screen, Text } from '@/components/ui';
import { usePuzzleDay } from '@/hooks/usePuzzleDay';
import { t } from '@/i18n';
import { PUZZLE_KINDS, type PuzzleKind } from '@/logic/daily';
import { todayKey } from '@/logic/dateKey';
import { isSolved as duoSolved, type DuoGrid, type DuoSymbol } from '@/logic/duo/validate';
import { isSolved as oneLineSolved, type OneLinePath } from '@/logic/oneline/validate';
import { emptyBoard, isSolved as rulersSolved, type RulersBoard as RulersState } from '@/logic/rulers/validate';
import { shouldShowInterstitial } from '@/monetization/adPolicy';
import { showInterstitial } from '@/monetization/interstitial';
import { isRewardedReady, showRewarded } from '@/monetization/rewarded';
import { useProgressStore } from '@/store/useProgressStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useTheme } from '@/theme';

const TITLES: Record<PuzzleKind, 'puzzleRulers' | 'puzzleDuo' | 'puzzleOneLine'> = {
  rulers: 'puzzleRulers',
  duo: 'puzzleDuo',
  oneline: 'puzzleOneLine',
};

/** Free players get one hint a day per puzzle; a rewarded ad buys one more. */
const FREE_HINTS = 1;

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Play() {
  const params = useLocalSearchParams<{ kind?: string; date?: string }>();
  const kind = (params.kind ?? 'rulers') as PuzzleKind;
  const date = params.date ?? todayKey();

  // Keyed so that moving to another puzzle or another day REMOUNTS the session.
  // Resetting the boards from an effect instead would cascade renders, and — far
  // worse — leave one frame in which the previous puzzle's answer is drawn on
  // the new grid.
  return <PuzzleSession key={`${date}:${kind}`} date={date} kind={kind} />;
}

function PuzzleSession({ date, kind }: { date: string; kind: PuzzleKind }) {
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const day = usePuzzleDay(date);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const markSolved = useProgressStore((s) => s.markSolved);

  // Written from an effect, never read during render: `Date.now()` in a render
  // body is impure and can shift on any incidental re-render.
  const startedAt = useRef(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solvedSeconds, setSolvedSeconds] = useState<number | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const [rulers, setRulers] = useState<RulersState>(() => emptyBoard(day.rulers.puzzle.size));
  const [duo, setDuo] = useState<DuoGrid>(() =>
    day.duo.puzzle.given.map((row) => [...row]),
  );
  const [line, setLine] = useState<OneLinePath>([]);

  const solved = useMemo(() => {
    if (kind === 'rulers') return rulersSolved(day.rulers.puzzle, rulers);
    if (kind === 'duo') return duoSolved(day.duo.puzzle, duo);
    return oneLineSolved(day.oneline.puzzle, line);
  }, [kind, day, rulers, duo, line]);

  useEffect(() => {
    if (!solved || solvedSeconds !== null) return;
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setSolvedSeconds(seconds);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markSolved(date, kind, seconds);

    // The interstitial runs AFTER the win is on screen and behind its own
    // pacing rules — never during play, never over the result.
    const state = useProgressStore.getState();
    const solvedTotal = Object.values(state.progress).reduce(
      (sum, d) => sum + Object.values(d.solved).filter(Boolean).length,
      0,
    );
    if (
      shouldShowInterstitial({
        gamesPlayed: solvedTotal,
        lastInterstitialAt: 0,
        now: Date.now(),
        adsRemoved: isPremium,
      })
    ) {
      showInterstitial();
    }
  }, [solved, solvedSeconds, date, kind, markSolved, isPremium]);

  const applyHint = useCallback(() => {
    // A hint fills one correct cell from the known answer — never a guess.
    if (kind === 'rulers') {
      const answer = day.rulers.solution;
      for (let r = 0; r < answer.length; r += 1) {
        const c = answer[r]!;
        if (rulers[r]?.[c] !== 'marker') {
          const next = rulers.map((row) => [...row]);
          next[r] = next[r]!.map(() => 'empty');
          next[r]![c] = 'marker';
          setRulers(next);
          return true;
        }
      }
    } else if (kind === 'duo') {
      const answer = day.duo.solution;
      for (let r = 0; r < answer.length; r += 1) {
        for (let c = 0; c < answer[r]!.length; c += 1) {
          if (duo[r]?.[c] !== answer[r]![c]) {
            const next = duo.map((row) => [...row]);
            next[r]![c] = answer[r]![c]!;
            setDuo(next);
            return true;
          }
        }
      }
    } else {
      const answer = day.oneline.solution;
      if (line.length < answer.length) {
        setLine(answer.slice(0, Math.max(1, line.length + 1)));
        return true;
      }
    }
    return false;
  }, [kind, day, rulers, duo, line]);

  const onHint = useCallback(() => {
    const allowance = isPremium ? Number.POSITIVE_INFINITY : FREE_HINTS;
    if (hintsUsed < allowance) {
      if (applyHint()) setHintsUsed((n) => n + 1);
      return;
    }
    if (!isRewardedReady()) {
      Alert.alert(t('noHintsLeft'), t('adNotReady'));
      return;
    }
    void showRewarded().then((earned) => {
      if (earned && applyHint()) setHintsUsed((n) => n + 1);
    });
  }, [applyHint, hintsUsed, isPremium]);

  const reset = useCallback(() => {
    setRulers(emptyBoard(day.rulers.puzzle.size));
    setDuo(day.duo.puzzle.given.map((row) => [...row]));
    setLine([]);
    startedAt.current = Date.now();
  }, [day]);

  const cycleRulers = (r: number, c: number) => {
    setRulers((board) => {
      const next = board.map((row) => [...row]);
      const cell = next[r]![c];
      next[r]![c] = cell === 'empty' ? 'crossed' : cell === 'crossed' ? 'marker' : 'empty';
      return next;
    });
  };

  const cycleDuo = (r: number, c: number) => {
    setDuo((grid) => {
      const next = grid.map((row) => [...row]);
      const cell = next[r]![c] ?? null;
      const order: (DuoSymbol | null)[] = [null, 'sun', 'moon'];
      next[r]![c] = order[(order.indexOf(cell) + 1) % order.length] ?? null;
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.base,
          }}
        >
          <Text variant="title">{t(TITLES[kind])}</Text>
          <IconButton
            icon="help-circle"
            accessibilityLabel={t('howToPlay')}
            onPress={() => {
              const tutorialKey =
                kind === 'rulers'
                  ? 'tutorialRulers'
                  : kind === 'duo'
                    ? 'tutorialDuo'
                    : 'tutorialOneLine';
              Alert.alert(t('howToPlay'), t(tutorialKey));
            }}
          />
        </View>
        <Text variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: spacing.lg }}>
          {t(kind === 'rulers' ? 'ruleRulers' : kind === 'duo' ? 'ruleDuo' : 'ruleOneLine')}
        </Text>

        {kind === 'rulers' ? (
          <RulersBoard
            puzzle={day.rulers.puzzle}
            board={rulers}
            onToggle={cycleRulers}
            showMistakes={isPremium}
          />
        ) : kind === 'duo' ? (
          <DuoBoard puzzle={day.duo.puzzle} grid={duo} onToggle={cycleDuo} showMistakes={isPremium} />
        ) : (
          <OneLineBoard puzzle={day.oneline.puzzle} path={line} onChange={setLine} />
        )}

        {solved ? (
          <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm }}>
            <Text variant="heading" tone="accent">
              {t('solvedTitle')}
            </Text>
            {solvedSeconds !== null ? (
              <Text variant="caption" tone="muted">
                {t('solvedIn', { time: formatSeconds(solvedSeconds) })}
              </Text>
            ) : null}
            {(() => {
              const currentIndex = PUZZLE_KINDS.indexOf(kind);
              const nextKind = PUZZLE_KINDS[(currentIndex + 1) % PUZZLE_KINDS.length]!;
              const dayProgress = useProgressStore.getState().progress[date];
              const isNextSolved = Boolean(dayProgress?.solved[nextKind]);
              return !isNextSolved ? (
                <Button
                  label={t('nextPuzzle')}
                  onPress={() => router.replace(`/play/${nextKind}?date=${date}`)}
                  style={{ marginTop: spacing.md }}
                />
              ) : null;
            })()}
            <Button
              label={t('backToToday')}
              variant="secondary"
              onPress={() => router.replace('/')}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <Button label={t('hint')} variant="secondary" onPress={onHint} style={{ flex: 1 }} />
            <Button label={t('restart')} variant="ghost" onPress={reset} style={{ flex: 1 }} />
          </View>
        )}

        {isPremium && !solved ? (
          <Text variant="micro" tone="faint" align="center" style={{ marginTop: spacing.md }}>
            {t('mistakesShown')}
          </Text>
        ) : null}
      </Screen>
      <BannerAdSlot />
    </View>
  );
}
