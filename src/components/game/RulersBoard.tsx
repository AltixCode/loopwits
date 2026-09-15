import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Board } from './Board';
import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { conflictsIn, type RulersBoard as BoardState, type RulersPuzzle } from '@/logic/rulers/validate';
import { REGION_HUES, mix, useTheme } from '@/theme';

/**
 * Rulers board: tap a cell to cycle empty -> crossed -> marker -> empty.
 *
 * The crossed state is the player's own note ("this cannot be it"), which is
 * how the puzzle is actually solved — without it every deduction has to be held
 * in the head, and the grid stops being usable above 6x6.
 */

/** Region tints, derived from the theme so both appearances stay legible. */
function useRegionColours(count: number): string[] {
  const { colors, isDark } = useTheme();
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) =>
        mix(REGION_HUES[i % REGION_HUES.length]!, colors.surface, isDark ? 0.26 : 0.17),
      ),
    [count, colors.surface, isDark],
  );
}

export function RulersBoard({
  puzzle,
  board,
  onToggle,
  showMistakes,
}: {
  puzzle: RulersPuzzle;
  board: BoardState;
  onToggle: (row: number, col: number) => void;
  showMistakes: boolean;
}) {
  const { colors } = useTheme();
  const regions = useRegionColours(puzzle.size);
  const conflicts = showMistakes ? conflictsIn(puzzle, board) : [];
  const isConflicted = (r: number, c: number) =>
    conflicts.some((conflict) => conflict.row === r && conflict.col === c);

  return (
    <Board size={puzzle.size}>
      {({ side, gap }) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const state =
                cell === 'marker' ? t('cellMarker') : cell === 'crossed' ? t('cellCrossed') : t('cellEmpty');
              return (
                <Pressable
                  key={`${r}-${c}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('cellA11y', { row: r + 1, col: c + 1 })}, ${state}`}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    onToggle(r, c);
                  }}
                  style={{
                    width: side,
                    height: side,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: regions[puzzle.regions[r]?.[c] ?? 0],
                    borderWidth: isConflicted(r, c) ? 2 : 0,
                    borderColor: colors.danger,
                  }}
                >
                  {cell === 'marker' ? (
                    <View
                      style={{
                        width: side * 0.56,
                        height: side * 0.56,
                        borderRadius: side * 0.28,
                        backgroundColor: colors.text,
                      }}
                    />
                  ) : cell === 'crossed' ? (
                    <Text variant="caption" tone="faint">
                      ×
                    </Text>
                  ) : null}
                </Pressable>
              );
            }),
          )}
        </View>
      )}
    </Board>
  );
}
