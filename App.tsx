import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.text}>M0 scaffold OK</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#11131a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#e6e8ef', fontSize: 16 },
});
