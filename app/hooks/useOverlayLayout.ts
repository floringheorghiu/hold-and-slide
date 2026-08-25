import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The reply bar's own stack height: marginBottom 16 + paddingTop 8 +
// content 32 + paddingBottom (inset + 8).
const REPLY_BAR_BASE_STACK = 64;
const GAP_ABOVE_REPLY_BAR = 21;
const REPLY_BAR_SIDE_MARGIN = 16;

/**
 * Geometry shared by everything that floats above the reply bar — currently
 * the transport pill and the copy toast. They sit on one row, flush with the
 * reply bar's own edges, so the numbers must agree. Deriving them here rather
 * than in each component stops the two drifting apart, and keeps the offsets
 * correct across devices whose home-indicator insets differ.
 */
export function useOverlayLayout() {
  const insets = useSafeAreaInsets();
  return {
    bottom: REPLY_BAR_BASE_STACK + Math.max(insets.bottom, 8) + GAP_ABOVE_REPLY_BAR,
    left: Math.max(REPLY_BAR_SIDE_MARGIN, insets.left),
    right: Math.max(REPLY_BAR_SIDE_MARGIN, insets.right),
  };
}
