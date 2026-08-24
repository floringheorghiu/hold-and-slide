import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export function ReadingHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + 12 }]}>
      <View style={styles.iconButton}>
        <Feather name="menu" size={20} color="#1F1E1D" />
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Side Menu</Text>
      </View>
      <View style={styles.iconButton}>
        <Feather name="plus" size={20} color="#1F1E1D" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F7',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D5CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D5CE',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    color: '#1F1E1D',
    fontSize: 14,
    fontWeight: '500',
  },
});
