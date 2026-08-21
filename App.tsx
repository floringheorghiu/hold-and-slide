import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ParagraphInteractive } from './app/components/ParagraphInteractive';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ParagraphInteractive />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#11131a' },
});
