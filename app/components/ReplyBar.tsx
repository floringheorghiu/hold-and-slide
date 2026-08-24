import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Non-functional. Set dressing to match the real app's composer bar.
export function ReplyBar() {
  return (
    <View style={styles.bar}>
      <View style={styles.sideButton}>
        <Feather name="plus" size={18} color="#8A8680" />
      </View>
      <Text style={styles.placeholder}>Reply to Claude</Text>
      <View style={styles.sideButton}>
        <Feather name="mic" size={18} color="#8A8680" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D5CE',
    backgroundColor: '#FFFFFF',
  },
  sideButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
    color: '#8A8680',
    fontSize: 15,
  },
});
