import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { MENU_WIDTH, REVEAL_DISTANCE } from '../lib/constants';
import type { IconBounds } from '../lib/geometry';

// Order is meaningful: play-from-here, copy, share — matched to iconIndex
// in ParagraphInteractive's commit handler.
const ICONS = ['play', 'copy', 'share'] as const;

type Props = {
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  onBounds: (b: IconBounds[]) => void;
};

export function EdgeMenu({ revealX, focusedIndex, onBounds }: Props) {
  const collected = useRef<IconBounds[]>([]);

  const panelStyle = useAnimatedStyle(() => {
    const t = revealX.value / REVEAL_DISTANCE;
    return {
      transform: [{ translateX: MENU_WIDTH * (1 - t) }],
      opacity: t,
    };
  });

  function report(index: number, b: IconBounds) {
    collected.current[index] = b;
    if (collected.current.filter(Boolean).length === ICONS.length) {
      onBounds([...collected.current]);
    }
  }

  return (
    <Animated.View style={[styles.panel, panelStyle]} pointerEvents="none">
      {ICONS.map((name, i) => (
        <Icon key={i} name={name} index={i} focusedIndex={focusedIndex} onMeasured={report} />
      ))}
    </Animated.View>
  );
}

function Icon({ name, index, focusedIndex, onMeasured }: {
  name: React.ComponentProps<typeof Feather>['name'];
  index: number;
  focusedIndex: SharedValue<number>;
  onMeasured: (index: number, b: IconBounds) => void;
}) {
  const ref = useRef<View>(null);

  const style = useAnimatedStyle(() => {
    const focused = focusedIndex.value === index;
    return {
      transform: [{ scale: focused ? 1.25 : 1 }],
      backgroundColor: focused ? '#DE7356' : '#1F1E1D',
    };
  });

  function handleLayout() {
    ref.current?.measureInWindow((_x, y, _w, h) => {
      onMeasured(index, { centerY: y + h / 2, halfHeight: h / 2 });
    });
  }

  return (
    <Animated.View ref={ref} style={[styles.icon, style]} onLayout={handleLayout}>
      <Feather name={name} size={22} color="#FFFFFF" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    gap: 18,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
