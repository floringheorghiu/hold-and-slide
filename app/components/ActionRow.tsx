import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Placeholder only — none of these do anything yet. Wired up in P2/P3.
const ICON_NAMES = ['copy', 'share', 'play', 'thumbs-up', 'thumbs-down', 'rotate-cw'] as const;

export function ActionRow() {
  return (
    <View style={styles.row}>
      {ICON_NAMES.map((name) => (
        <Pressable key={name} style={styles.button} hitSlop={8}>
          <Feather name={name} size={20} color="#8A8680" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
