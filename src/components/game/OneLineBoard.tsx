import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Board } from './Board';
import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { samePoint, type OneLinePath, type OneLinePuzzle, type Point } from '@/logic/oneline/validate';
import { useTheme, withAlpha } from '@/theme';

/**
 * OneLine board: drag to draw one continuous path.
 *
 * Cell geometry comes from `Board`'s render prop rather than an onLayout
 * measurement, so there is no ref to read during render and no frame in which
 * the grid is drawn but not yet hit-testable.
 *
 * Hit-testing runs on the JS thread from the pan's coordinates rather than in a
 * worklet. The path is React state the validator reads, so it has to cross to
 * JS anyway, and a worklet calling a plain JS helper throws "Tried to
 * synchronously call a Remote Function" on the first touch — invisible to Jest,
 * fatal on device.
 */
function Grid({
  puzzle,
  path,
  onChange,
  side,
  gap,
}: {
  puzzle: OneLinePuzzle;
  path: OneLinePath;
  onChange: (path: OneLinePath) => void;
  side: number;
  gap: number;
}) {
  const { colors } = useTheme();

  const dotIndexAt = useCallback(
    (p: Point) => puzzle.dots.findIndex((d) => samePoint(d, p)),
    [puzzle.dots],
  );

  const cellAt = useCallback(
    (x: number, y: number): Point | null => {
      const step = side + gap;
      if (step <= 0) return null;
      const c = Math.floor(x / step);
      const r = Math.floor(y / step);
      if (r < 0 || r >= puzzle.size || c < 0 || c >= puzzle.size) return null;
      return { r, c };
    },
    [side, gap, puzzle.size],
  );

  const extend = useCallback(
    (cell: Point) => {
      if (path.length === 0) {
        // A path may only start on the first dot.
        if (puzzle.dots[0] && samePoint(cell, puzzle.dots[0])) {
          void Haptics.selectionAsync();
          onChange([cell]);
        }
        return;
      }
      const last = path[path.length - 1]!;
      if (samePoint(cell, last)) return;

      // Backing onto the previous cell retracts rather than rejects — without
      // it, correcting one wrong turn means redrawing the whole path.
      const previous = path[path.length - 2];
      if (previous && samePoint(cell, previous)) {
        onChange(path.slice(0, -1));
        return;
      }

      if (Math.abs(cell.r - last.r) + Math.abs(cell.c - last.c) !== 1) return;
      if (path.some((p) => samePoint(p, cell))) return;

      // A dot may only be entered when it is the next one due.
      const index = dotIndexAt(cell);
      if (index !== -1 && index !== path.filter((p) => dotIndexAt(p) !== -1).length) return;

      void Haptics.selectionAsync();
      onChange([...path, cell]);
    },
    [path, onChange, puzzle.dots, dotIndexAt],
  );

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      const cell = cellAt(event.x, event.y);
      if (cell) extend(cell);
    })
    .onUpdate((event) => {
      const cell = cellAt(event.x, event.y);
      if (cell) extend(cell);
    });

  const inPath = (r: number, c: number) => path.some((p) => p.r === r && p.c === c);

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: puzzle.size }, (_, r) =>
          Array.from({ length: puzzle.size }, (_, c) => {
            const dot = dotIndexAt({ r, c });
            return (
              <View
                key={`${r}-${c}`}
                accessible
                accessibilityLabel={t('cellA11y', { row: r + 1, col: c + 1 })}
                style={{
                  width: side,
                  height: side,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: inPath(r, c) ? withAlpha(colors.accent, 0.35) : colors.surface,
                }}
              >
                {dot !== -1 ? (
                  <View
                    style={{
                      width: side * 0.66,
                      height: side * 0.66,
                      borderRadius: side * 0.33,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accent,
                    }}
                  >
                    <Text variant="caption" color={colors.onAccent}>
                      {String(dot + 1)}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          }),
        )}
      </View>
    </GestureDetector>
  );
}

export function OneLineBoard(props: {
  puzzle: OneLinePuzzle;
  path: OneLinePath;
  onChange: (path: OneLinePath) => void;
}) {
  return (
    <Board size={props.puzzle.size}>
      {({ side, gap }) => <Grid {...props} side={side} gap={gap} />}
    </Board>
  );
}
