import * as Haptics from 'expo-haptics';

export type HapticKind = 'armed' | 'reveal' | 'focusChange' | 'commit' | 'cancel';

export function triggerHaptic(kind: HapticKind): void {
  switch (kind) {
    case 'armed':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'reveal':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case 'focusChange':
      Haptics.selectionAsync();
      return;
    case 'commit':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'cancel':
      return;
  }
}
