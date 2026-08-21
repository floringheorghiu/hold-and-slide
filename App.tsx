import { GestureDetector } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native';
import { useHoldSlideGesture } from './app/hooks/useHoldSlideGesture';
import { DebugOverlay } from './app/components/DebugOverlay';

export default function App() {
  const { gesture, phase, revealX, focusedIndex } = useHoldSlideGesture();

  return (
    <GestureHandlerRootView style={styles.root}>
      <DebugOverlay phase={phase} revealX={revealX} focusedIndex={focusedIndex} />
      <View style={styles.center}>
        <GestureDetector gesture={gesture}>
          <View style={styles.target}>
            <Text style={styles.text}>hold me, then slide left</Text>
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#11131a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  target: { paddingVertical: 18, paddingHorizontal: 24, backgroundColor: '#232735', borderRadius: 10 },
  text: { color: '#e6e8ef', fontSize: 17 },
});
