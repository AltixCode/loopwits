import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Board } from './Board';
import { t } from '@/i18n';
import { conflictsIn, type DuoGrid, type DuoPuzzle } from '@/logic/duo/validate';
import { useTheme, withAlpha } from '@/theme';

/**
 * Duo board: tap to cycle empty -> sun -> moon -> empty.
 *
 * Given cells are drawn on a firmer ground and are not interactive — a puzzle
 * that lets you "change" a clue and then calls you wrong is unplayable.
 * Symbols are shapes, not colours: red/green would exclude the ~8% of men with
 * a colour-vision deficiency from the entire game.
 */
export function DuoBoard({
  puzzle,
  grid,
  onToggle,
  showMistakes,
}: {
  puzzle: DuoPuzzle;
  grid: DuoGrid;
  onToggle: (row: number, col: number) => void;
  showMistakes: boolean;
}) {
  const { colors } = useTheme();
  const conflicts = showMistakes ? conflictsIn(puzzle, grid) : [];
  const isConflicted = (r: number, c: number) =>
    conflicts.some((conflict) => conflict.row === r && conflict.col === c);

  return (
    <Board size={puzzle.size}>
      {({ side, gap }) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const given = puzzle.given[r]?.[c] ?? null;
              const label =
                cell === 'sun' ? t('cellSun') : cell === 'moon' ? t('cellMoon') : t('cellEmpty');
              return (
                <Pressable
                  key={`${r}-${c}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('cellA11y', { row: r + 1, col: c + 1 })}, ${label}`}
                  accessibilityState={{ disabled: Boolean(given) }}
                  disabled={Boolean(given)}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    onToggle(r, c);
                  }}
                  style={{
                    width: side,
                    height: side,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: given ? colors.surfaceAlt : colors.surface,
                    borderWidth: isConflicted(r, c) ? 2 : 0,
                    borderColor: colors.danger,
                  }}
                >
                  {cell === 'sun' ? (
                    <View
                      style={{
                        width: side * 0.5,
                        height: side * 0.5,
                        borderRadius: side * 0.25,
                        backgroundColor: given ? colors.text : colors.accent,
                      }}
                    />
                  ) : cell === 'moon' ? (
                    <View
                      style={{
                        width: side * 0.5,
                        height: side * 0.5,
                        borderRadius: side * 0.25,
                        borderWidth: Math.max(2, side * 0.11),
                        borderColor: given ? colors.text : colors.accent,
                        backgroundColor: withAlpha(colors.text, 0),
                      }}
                    />
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
