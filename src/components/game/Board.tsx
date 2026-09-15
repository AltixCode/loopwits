import React, { type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme';

/**
 * The square play surface every puzzle type sits on.
 *
 * It sizes itself from the window rather than taking a fixed cell size, so a
 * 5x5 and an 8x8 both fill the same space and neither overflows on a small
 * phone or looks lost on a tablet. `maxSide` stops it becoming a wall of grid
 * on an iPad.
 */
export function Board({
  size,
  children,
  maxSide = 460,
}: {
  size: number;
  children: (cell: { side: number; gap: number }) => ReactNode;
  maxSide?: number;
}) {
  const { width, height } = useWindowDimensions();
  const { spacing, colors, radius } = useTheme();

  // Leave room for the header, the toolbar and the banner: the board must never
  // be the reason a screen scrolls.
  // Sized from the space there is. The old flat 460pt cap was set against a
  // small phone: on a 6.9" screen it left the board in the top third with the
  // rest of the display empty, which reads as an app nobody has opened on a
  // modern device — and a 13" iPad was worse.
  const cap = width >= 700 ? maxSide * 1.5 : maxSide * 1.2;
  const available = Math.min(width - spacing.base * 2, height * 0.58, cap);
  const gap = size > 7 ? 2 : 3;
  const side = Math.floor((available - gap * (size - 1)) / size);
  const board = side * size + gap * (size - 1);

  return (
    <View
      style={{
        width: board,
        height: board,
        alignSelf: 'center',
        padding: 0,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceAlt,
      }}
    >
      {children({ side, gap })}
    </View>
  );
}
