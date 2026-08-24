# Hold-and-Slide Edge Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a POC that answers one question — does "long-press a word, slide left to reveal an edge menu, scrub vertically through icons, release to commit" feel good on real hardware?

**Architecture:** Gesture state lives in Reanimated shared values and is evaluated inside worklets on the UI thread. React state is a mirror, updated through `runOnJS` only on discrete transitions, never per frame. Pure math (phase helpers, clamping, hit-testing) lives in modules that import nothing from React Native, so Jest can test it directly.

**Tech Stack:** Expo SDK 54 (managed, TypeScript), React Native 0.81.5, Reanimated 4.1.1, react-native-worklets 0.5.1, react-native-gesture-handler 2.28.0, expo-haptics 15.0.8. Runs in Expo Go.

**Spec:** `docs/superpowers/specs/2026-08-21-hold-slide-edge-menu-design.md`, which reconciles the source spec `Cross-platform_app_prototype.md`.

## Global Constraints

- Target Expo SDK 54. The SDK is dictated by the test device: Expo Go supports
  exactly one SDK, and the human's iPhone caps at Expo Go 54.0.2. Do not upgrade
  the SDK without a new device check.
- Install dependencies with `npx expo install`, never `npm install`. Expo Go ships
  fixed native binaries. Only the pinned versions load.
- Import `runOnJS` from `react-native-worklets`. Import `useSharedValue`, `useAnimatedStyle`, `useDerivedValue`, and `withTiming` from `react-native-reanimated`.
- Never wrap a colour string in `withTiming`. It silently renders nothing in
  Reanimated 4.1.7 — no error, no warning, no colour. Animate colours by driving a
  numeric `progress` shared value with `withTiming`, then feeding it to
  `interpolateColor`. Confirmed on device: the token highlight failed exactly this
  way and cost a debugging cycle.
- Never call `runOnJS` on every `onUpdate` frame. Call it only when a discrete value changes. Breaking this invalidates the POC.
- Icon geometry crosses threads. It must live in a shared value. A plain JavaScript array is captured by closure when the worklet is created, so the worklet would read stale coordinates.
- Keep `pan`'s `if (!armed.value) return;` guard. Gesture-handler recognizers cannot hand off mid-touch, so `pan` receives updates from touch-down.
- Use the exact names from the spec: `armed`, `phase`, `revealX`, `focusedIndex`. Do not rename or introduce synonyms.
- Files in `lib/` must not import from `react-native` or `react-native-reanimated`. This keeps them unit-testable.
- Simulators and emulators cannot produce haptics. No simulator result passes a gate.
- Write documentation and commit messages using `.claude/skills/clear-technical-writing/SKILL.md`.
- Confirm `git rev-parse --show-toplevel` returns the project directory before any
  `git add`. It must not return a parent directory. Always stage with an explicit
  pathspec, `git add -A -- .`, never bare `git add -A`. A `.git` above the project
  would otherwise redefine what "everything" means and stage unrelated files.

## File Structure

| File | Responsibility |
|---|---|
| `App.tsx` | Mounts `GestureHandlerRootView` and one `ParagraphInteractive` |
| `app/components/GestureToken.tsx` | One word token. Owns its highlight. |
| `app/components/EdgeMenu.tsx` | Reveal panel. Renders 3 icons from `focusedIndex`. |
| `app/components/ParagraphInteractive.tsx` | Composes tokens, gesture, and menu |
| `app/components/DebugOverlay.tsx` | On-device readout of phase, revealX, focusedIndex. Removed at M4. |
| `app/hooks/useHoldSlideGesture.ts` | The `Gesture.Simultaneous` composition |
| `app/lib/phase.ts` | Phase enum and pure predicates. No RN imports. |
| `app/lib/geometry.ts` | `clamp` and `hitTest`. Pure. No RN imports. |
| `app/lib/constants.ts` | Tunable numbers in one place |
| `app/lib/haptics.ts` | `triggerHaptic(kind)` wrapper. Added at M4. |
| `app/lib/__tests__/` | Jest tests for `phase.ts` and `geometry.ts` |

## Deviations from the source spec

- **D4:** Icon bounds live in a single `useSharedValue<IconBounds[]>` rather than one shared value per icon. Reanimated 4 stores arrays fine, and one value is easier to write atomically in `onLayout`.
- **D5:** `hitTest` moves out of the hook into `app/lib/geometry.ts` so it can be unit-tested. The hook wraps it.

---

### Task M0: Scaffold and verify the toolchain

**Files:**
- Create: project root via template
- Create: `app/lib/constants.ts`
- Modify: `App.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: a booting Expo Go app; `npm test` and `npx tsc --noEmit` both runnable

- [ ] **Step 1: Scaffold into the current directory**

The directory already contains `docs/`, `.claude/`, and the source spec. Scaffold into a temporary directory and move files in, so nothing is overwritten.

```bash
npx create-expo-app@latest ios-menu-app --template blank-typescript
```

Use the `blank-typescript` template, not the default. The default template uses expo-router, which claims the `app/` directory for routes. The plan uses `app/` for plain source folders.

- [ ] **Step 2: Move the scaffold into the repository root**

```bash
cd ios-menu-app && mv .gitignore App.tsx app.json index.ts package.json tsconfig.json assets ../ 2>/dev/null; cd .. && rm -rf ios-menu-app
```

Verify `App.tsx` and `package.json` now sit beside `docs/`.

- [ ] **Step 3: Install pinned dependencies**

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets expo-haptics babel-preset-expo
```

`babel-preset-expo` is included deliberately. The `blank-typescript` template
omits it from its own `package.json` at this SDK version, and Metro fails on
first boot with `Cannot find module 'babel-preset-expo'`. Installing it here
avoids that failure. Found during M0 execution.

- [ ] **Step 4: Verify the pins match the spec**

```bash
node -e "const p=require('./package.json').dependencies; console.log(p)"
```

Expected: `react-native-reanimated` 4.1.x, `react-native-worklets` 0.5.x, `react-native-gesture-handler` 2.28.x, `expo-haptics` 15.0.x. Stop and report if any differ.

- [ ] **Step 5: Add the Reanimated babel plugin**

Create `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
```

The worklets plugin must be last in the plugin list. Without it, every `'worklet'` directive is ignored and gesture callbacks silently run on the JavaScript thread.

- [ ] **Step 6: Add Jest**

```bash
npx expo install jest-expo jest @types/jest
```

Add to `package.json`:

```json
"scripts": {
  "test": "jest",
  "typecheck": "tsc --noEmit"
},
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 7: Create the constants module**

Create `app/lib/constants.ts`:

```ts
export const LONG_PRESS_MS = 380;
export const LONG_PRESS_MAX_DISTANCE = 20;
export const MENU_WIDTH = 220;
export const REVEAL_THRESHOLD = 60;
export const MAX_DRAG = 320;
export const HIT_PADDING = 12;
export const ICON_COUNT = 3;
```

`LONG_PRESS_MAX_DISTANCE` gives the finger 20px of tolerance before the long press fails. The gesture-handler default is 10px, which is tight for a hold that becomes a slide.

- [ ] **Step 8: Replace App.tsx with a root view**

```tsx
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
```

`GestureHandlerRootView` must wrap the whole tree. Gestures silently never fire without it, and it produces no error.

- [ ] **Step 9: Verify typecheck and test runner**

```bash
npm run typecheck
npx jest --passWithNoTests
```

Expected: both exit 0.

- [ ] **Step 10: Boot in Expo Go**

```bash
npx expo start
```

Expected: QR code appears. Report the QR to the orchestrator. The human scans it on both devices and confirms "M0 scaffold OK" renders.

- [ ] **Step 11: Commit**

```bash
git add -A -- .
git commit -m "chore: scaffold Expo TypeScript app with gesture and animation deps"
```

---

### Task M1: Gesture skeleton and debug overlay

Build the recognizer and prove it before building any menu. This is the task the source spec says to do first.

**Files:**
- Create: `app/lib/phase.ts`
- Create: `app/lib/__tests__/phase.test.ts`
- Create: `app/hooks/useHoldSlideGesture.ts`
- Create: `app/components/DebugOverlay.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `app/lib/constants.ts` from M0
- Produces: `Phase`, `phaseName(p)`, `isDragPhase(p)`, `isMenuPhase(p)` from `app/lib/phase.ts`; `useHoldSlideGesture()` returning `{ gesture, phase, revealX, focusedIndex }` where the last three are `SharedValue<number>`

- [ ] **Step 1: Write the failing test for phase helpers**

Create `app/lib/__tests__/phase.test.ts`:

```ts
import { Phase, phaseName, isDragPhase, isMenuPhase } from '../phase';

describe('phase', () => {
  it('names each phase', () => {
    expect(phaseName(Phase.IDLE)).toBe('IDLE');
    expect(phaseName(Phase.SCRUBBING)).toBe('SCRUBBING');
  });

  it('returns UNKNOWN for an out-of-range value', () => {
    expect(phaseName(99)).toBe('UNKNOWN');
  });

  it('treats ARMED and DRAGGING as drag phases', () => {
    expect(isDragPhase(Phase.ARMED)).toBe(true);
    expect(isDragPhase(Phase.DRAGGING)).toBe(true);
    expect(isDragPhase(Phase.MENU_OPEN)).toBe(false);
  });

  it('treats MENU_OPEN and SCRUBBING as menu phases', () => {
    expect(isMenuPhase(Phase.MENU_OPEN)).toBe(true);
    expect(isMenuPhase(Phase.SCRUBBING)).toBe(true);
    expect(isMenuPhase(Phase.IDLE)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest app/lib/__tests__/phase.test.ts
```

Expected: FAIL, cannot find module `../phase`.

- [ ] **Step 3: Implement the phase module**

Create `app/lib/phase.ts`:

```ts
export const Phase = {
  IDLE: 0,
  PRESSING: 1,
  ARMED: 2,
  DRAGGING: 3,
  MENU_OPEN: 4,
  SCRUBBING: 5,
} as const;

export type PhaseValue = (typeof Phase)[keyof typeof Phase];

const NAMES = ['IDLE', 'PRESSING', 'ARMED', 'DRAGGING', 'MENU_OPEN', 'SCRUBBING'];

export function phaseName(p: number): string {
  'worklet';
  return NAMES[p] ?? 'UNKNOWN';
}

export function isDragPhase(p: number): boolean {
  'worklet';
  return p === Phase.ARMED || p === Phase.DRAGGING;
}

export function isMenuPhase(p: number): boolean {
  'worklet';
  return p === Phase.MENU_OPEN || p === Phase.SCRUBBING;
}
```

COMMIT and CANCEL from the spec's diagram are transitions, not resting states. They are handled in `onEnd` and are not enum members.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest app/lib/__tests__/phase.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Write the gesture hook**

Create `app/hooks/useHoldSlideGesture.ts`:

```ts
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Phase } from '../lib/phase';
import {
  LONG_PRESS_MS,
  LONG_PRESS_MAX_DISTANCE,
  MENU_WIDTH,
  REVEAL_THRESHOLD,
  MAX_DRAG,
} from '../lib/constants';

export function useHoldSlideGesture() {
  const armed = useSharedValue(false);
  const phase = useSharedValue<number>(Phase.IDLE);
  const revealX = useSharedValue(0);
  const focusedIndex = useSharedValue(-1);

  function reset() {
    'worklet';
    armed.value = false;
    phase.value = Phase.IDLE;
    focusedIndex.value = -1;
    revealX.value = withTiming(0, { duration: 180 });
  }

  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .maxDistance(LONG_PRESS_MAX_DISTANCE)
    .onBegin(() => {
      phase.value = Phase.PRESSING;
    })
    .onStart(() => {
      armed.value = true;
      phase.value = Phase.ARMED;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (!armed.value) return;

      if (e.translationX > 12) {
        reset();
        return;
      }

      const dragged = -e.translationX;
      if (dragged > MAX_DRAG) {
        reset();
        return;
      }

      revealX.value = Math.min(Math.max(dragged, 0), MENU_WIDTH);
      phase.value =
        revealX.value > REVEAL_THRESHOLD ? Phase.MENU_OPEN : Phase.DRAGGING;
    })
    .onEnd(() => {
      reset();
    })
    .onFinalize(() => {
      if (armed.value) reset();
    });

  const gesture = Gesture.Simultaneous(longPress, pan);

  return { gesture, phase, revealX, focusedIndex };
}
```

M1 has no menu, so `onEnd` always resets. Commit handling arrives in M3 once `focusedIndex` can be set. `onFinalize` catches interruptions such as an incoming call, which would otherwise leave the panel stuck open.

Note the guard order. Cancel checks run before `revealX` is written, so a cancelling drag never paints a partial reveal.

- [ ] **Step 6: Write the debug overlay**

Create `app/components/DebugOverlay.tsx`:

```tsx
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { StyleSheet, TextInput } from 'react-native';
import { phaseName } from '../lib/phase';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
};

export function DebugOverlay({ phase, revealX, focusedIndex }: Props) {
  const props = useAnimatedProps(() => {
    const text = `${phaseName(phase.value)}  x=${Math.round(revealX.value)}  i=${focusedIndex.value}`;
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTextInput
      style={styles.readout}
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={props as never}
    />
  );
}

const styles = StyleSheet.create({
  readout: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: '#7ee787',
    fontFamily: 'Courier',
    fontSize: 14,
    padding: 0,
  },
});
```

This uses an uneditable `TextInput` rather than `Text` deliberately. `text` is an animatable native prop on `TextInput`, so the readout updates entirely on the UI thread. A `Text` component would need `runOnJS` on every frame, which is the exact pattern this POC exists to avoid.

Two details are load-bearing. Both are copied from Reanimated's own
`PerformanceMonitor` component, which uses this identical technique at 4.1.7:

- No whitelisting call. `addWhitelistedNativeProps` is deprecated and a documented
  no-op in Reanimated 4, and the older singular `addWhitelistedNativeProp` never
  existed on this major version.
- `useAnimatedProps` must return both `text` and `defaultValue`, set to the same
  string. Returning `text` alone does not render reliably.

- [ ] **Step 7: Mount the skeleton**

Replace the body of `App.tsx`:

```tsx
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
```

- [ ] **Step 8: Verify typecheck and tests**

```bash
npm run typecheck && npx jest
```

Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A -- .
git commit -m "feat: add gesture skeleton with UI-thread debug overlay"
```

- [ ] **Step 10: HUMAN GATE — validate on both devices**

Report to the orchestrator that M1 is ready. The human checks on iPhone and Android:

1. Touch and hold. The readout shows PRESSING, then ARMED after roughly 380ms.
2. Keep holding and slide left. The readout shows DRAGGING, then MENU_OPEN past 60px.
3. Release. The readout returns to IDLE.
4. Slide right instead. The readout returns to IDLE.
5. Slide left more than 320px. The readout returns to IDLE.

The question for the human is not whether the numbers change. It is whether the arm-then-slide timing feels natural. Record any request to retune `LONG_PRESS_MS` or `REVEAL_THRESHOLD`. Do not proceed to M2 until the human approves.

---

### Task M2: Token layer

**Files:**
- Create: `app/components/GestureToken.tsx`
- Create: `app/components/ParagraphInteractive.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `useHoldSlideGesture` from M1
- Produces: `ParagraphInteractive` with no required props; `GestureToken` with props `{ text: string; index: number; activeIndex: SharedValue<number> }`

- [ ] **Step 1: Write the token component**

Create `app/components/GestureToken.tsx`:

```tsx
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';

const PAGE_BG = '#11131a';
const HIGHLIGHT_BG = '#5b6699';

type Props = {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
};

export function GestureToken({ text, index, activeIndex }: Props) {
  const progress = useDerivedValue(() =>
    withTiming(activeIndex.value === index ? 1 : 0, { duration: 120 }),
  );

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [PAGE_BG, HIGHLIGHT_BG],
    ),
    transform: [{ scale: 1 + progress.value * 0.08 }],
  }));

  return (
    <Animated.View style={[styles.token, style]}>
      <Text style={styles.text} selectable={false}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: { borderRadius: 4, paddingHorizontal: 2 },
  text: { color: '#e6e8ef', fontSize: 18, lineHeight: 28 },
});
```

`selectable={false}` keeps the platform's own text selection out of the way. The POC
drives highlighting itself.

`PAGE_BG` must match the root background in `App.tsx`. Interpolating from the page
colour rather than from `'transparent'` avoids Reanimated's transparent-black
endpoint, which darkens the midpoint of the fade.

The 8 percent scale is deliberate. At M3 the human must track which word he grabbed
while simultaneously watching the icon menu, and a size change is readable in
peripheral vision where a colour change is not.

The highlight is driven by `activeIndex`, a shared value. No React state is involved, so a token highlighting does not re-render the paragraph.

- [ ] **Step 2: Write the paragraph composer**

Create `app/components/ParagraphInteractive.tsx`:

```tsx
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { GestureToken } from './GestureToken';
import { useHoldSlideGesture } from '../hooks/useHoldSlideGesture';
import { DebugOverlay } from './DebugOverlay';

const PARAGRAPH =
  'Hold any word in this paragraph, then slide left to reveal the menu and scrub through the icons.';

const TOKENS = PARAGRAPH.split(' ');

export function ParagraphInteractive() {
  const activeIndex = useSharedValue(-1);
  const { gesture, phase, revealX, focusedIndex } = useHoldSlideGesture({ activeIndex });

  return (
    <View style={styles.wrap}>
      <DebugOverlay phase={phase} revealX={revealX} focusedIndex={focusedIndex} />
      <View style={styles.paragraph}>
        {TOKENS.map((t, i) => (
          <GestureDetector key={i} gesture={gesture}>
            <View>
              <GestureToken text={t} index={i} activeIndex={activeIndex} />
            </View>
          </GestureDetector>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24 },
});
```

- [ ] **Step 2a: Move shared-value ownership out of the hook**

The hook currently creates `phase`, `revealX`, and `focusedIndex` itself. That was
correct when one gesture existed. It is wrong now: every token needs its own
gesture instance, but they must all read and write ONE set of shared values.
Otherwise each token gets a private state machine and the menu cannot know which
token opened it.

Change `useHoldSlideGesture` to receive them instead of creating them:

```ts
import type { SharedValue } from 'react-native-reanimated';

type Args = {
  tokenIndex: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
};

export function useHoldSlideGesture({
  tokenIndex,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
}: Args) {
```

Delete the four `useSharedValue` lines for `phase`, `revealX`, and `focusedIndex`
from the hook body. Keep `armed` created locally — it is per-gesture by nature,
since only one token can be armed at a time and each recognizer needs its own.

Add `activeIndex.value = tokenIndex;` inside `longPress.onStart`, beside the
existing `armed` and `phase` assignments.

Add `activeIndex.value = -1;` inside `reset()`.

Return only the gesture:

```ts
  return { gesture };
```

- [ ] **Step 2b: Give each token its own gesture instance**

A hook cannot be called from a callback or a loop body, so the per-token hook call
needs its own component. Add this to `ParagraphInteractive.tsx`:

```tsx
function Token({
  text,
  index,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
}: {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
}) {
  const { gesture } = useHoldSlideGesture({
    tokenIndex: index,
    activeIndex,
    phase,
    revealX,
    focusedIndex,
  });

  return (
    <GestureDetector gesture={gesture}>
      <View>
        <GestureToken text={text} index={index} activeIndex={activeIndex} />
      </View>
    </GestureDetector>
  );
}
```

`ParagraphInteractive` creates the four shared values once with `useSharedValue`,
renders `<DebugOverlay />` with three of them, and maps `TOKENS` to `<Token />`,
passing all four down. Remove the `onGesture` prop idea entirely — it does not
exist in this design.

- [ ] **Step 3: Update App.tsx**

```tsx
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
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npx jest
```

Expected: both exit 0.

- [ ] **Step 5: Review for the per-frame rule**

Search the diff for `runOnJS`. There must be none in `onUpdate`. Confirm no `useState` call is driven by gesture movement.

- [ ] **Step 6: Commit**

```bash
git add -A -- .
git commit -m "feat: add token layer with shared-value highlight"
```

- [ ] **Step 7: Device check**

Report to the orchestrator. The human confirms on both devices that holding a word highlights that word and no other, and that releasing clears it.

---

### Task M3: Edge menu and hit-testing

**Files:**
- Create: `app/lib/geometry.ts`
- Create: `app/lib/__tests__/geometry.test.ts`
- Create: `app/components/EdgeMenu.tsx`
- Modify: `app/hooks/useHoldSlideGesture.ts`
- Modify: `app/components/ParagraphInteractive.tsx`

**Interfaces:**
- Consumes: `useHoldSlideGesture` from M2
- Produces: `IconBounds` type `{ centerY: number; halfHeight: number }`; `clamp(v, min, max)`; `hitTest(absoluteY, bounds, padding)` returning an index or -1; `EdgeMenu` with props `{ revealX: SharedValue<number>; focusedIndex: SharedValue<number>; onBounds: (b: IconBounds[]) => void }`

- [ ] **Step 1: Write the failing geometry test**

Create `app/lib/__tests__/geometry.test.ts`:

```ts
import { clamp, hitTest, IconBounds } from '../geometry';

const BOUNDS: IconBounds[] = [
  { centerY: 100, halfHeight: 20 },
  { centerY: 160, halfHeight: 20 },
  { centerY: 220, halfHeight: 20 },
];

describe('clamp', () => {
  it('passes through a value in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below and above', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('hitTest', () => {
  it('finds the icon under an exact centre', () => {
    expect(hitTest(160, BOUNDS, 0)).toBe(1);
  });

  it('finds an icon inside its half-height', () => {
    expect(hitTest(115, BOUNDS, 0)).toBe(0);
  });

  it('returns -1 when the touch is outside every icon', () => {
    expect(hitTest(400, BOUNDS, 0)).toBe(-1);
  });

  it('uses padding to widen the hit zone beyond the icon', () => {
    expect(hitTest(130, BOUNDS, 0)).toBe(-1);
    expect(hitTest(130, BOUNDS, 12)).toBe(0);
  });

  it('returns -1 for empty bounds', () => {
    expect(hitTest(100, [], 12)).toBe(-1);
  });

  it('picks the nearest centre when padded zones overlap', () => {
    // Centres 100 and 160 -> midpoint 130. Padding 40 makes both zones reach y=130,
    // so this asserts the tie is broken by distance, not by array order.
    expect(hitTest(129, BOUNDS, 40)).toBe(0);
    expect(hitTest(131, BOUNDS, 40)).toBe(1);
  });
});
```

The overlap test matters. Padding large enough to help a moving finger will make adjacent zones overlap, and a naive first-match scan would then favour whichever icon is earlier in the array. Nearest-centre keeps focus tracking the finger.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest app/lib/__tests__/geometry.test.ts
```

Expected: FAIL, cannot find module `../geometry`.

- [ ] **Step 3: Implement geometry**

Create `app/lib/geometry.ts`:

```ts
export type IconBounds = { centerY: number; halfHeight: number };

export function clamp(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

export function hitTest(
  absoluteY: number,
  bounds: IconBounds[],
  padding: number,
): number {
  'worklet';
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i];
    const reach = b.halfHeight + padding;
    const distance = Math.abs(absoluteY - b.centerY);
    if (distance <= reach && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }

  return best;
}
```

A linear scan is correct here. The menu has 3 icons, so nothing smarter is warranted.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest app/lib/__tests__/geometry.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Write the edge menu**

Create `app/components/EdgeMenu.tsx`:

```tsx
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useRef } from 'react';
import { MENU_WIDTH } from '../lib/constants';
import type { IconBounds } from '../lib/geometry';

const ICONS = ['★', '✎', '⌫'];

type Props = {
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  onBounds: (b: IconBounds[]) => void;
};

export function EdgeMenu({ revealX, focusedIndex, onBounds }: Props) {
  const collected = useRef<IconBounds[]>([]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: MENU_WIDTH - revealX.value }],
    opacity: revealX.value / MENU_WIDTH,
  }));

  function report(index: number, b: IconBounds) {
    collected.current[index] = b;
    if (collected.current.filter(Boolean).length === ICONS.length) {
      onBounds([...collected.current]);
    }
  }

  return (
    <Animated.View style={[styles.panel, panelStyle]} pointerEvents="none">
      {ICONS.map((glyph, i) => (
        <Icon key={i} glyph={glyph} index={i} focusedIndex={focusedIndex} onMeasured={report} />
      ))}
    </Animated.View>
  );
}

function Icon({ glyph, index, focusedIndex, onMeasured }: {
  glyph: string;
  index: number;
  focusedIndex: SharedValue<number>;
  onMeasured: (index: number, b: IconBounds) => void;
}) {
  const ref = useRef<View>(null);

  const style = useAnimatedStyle(() => {
    const focused = focusedIndex.value === index;
    return {
      transform: [{ scale: focused ? 1.25 : 1 }],
      backgroundColor: focused ? '#3b4260' : '#232735',
    };
  });

  function handleLayout() {
    ref.current?.measureInWindow((_x, y, _w, h) => {
      onMeasured(index, { centerY: y + h / 2, halfHeight: h / 2 });
    });
  }

  return (
    <Animated.View ref={ref} style={[styles.icon, style]} onLayout={handleLayout}>
      <Text style={styles.glyph}>{glyph}</Text>
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
  glyph: { color: '#e6e8ef', fontSize: 22 },
});
```

`onLayout` reports coordinates relative to the parent. The panel is positioned absolutely against the root, so these values are comparable to `absoluteY` only if the panel starts at the screen top, which it does. Verify this on device in Step 9. If focus is offset by a constant, use `measureInWindow` instead.

- [ ] **Step 6: Store bounds in a shared value and hit-test**

Modify `app/hooks/useHoldSlideGesture.ts`. Add to the args and the body:

```ts
import { hitTest, clamp, IconBounds } from '../lib/geometry';
import { HIT_PADDING, MENU_WIDTH, REVEAL_THRESHOLD, MAX_DRAG } from '../lib/constants';
import { runOnJS } from 'react-native-worklets';
```

Add a shared value:

```ts
  const iconBounds = useSharedValue<IconBounds[]>([]);
```

Do NOT create `iconBounds` inside the hook. Since M2 the hook receives its shared
values as arguments and returns only `{ gesture }`. Add `iconBounds` to the `Args`
type as `SharedValue<IconBounds[]>`, create it once in `ParagraphInteractive` with
`useSharedValue<IconBounds[]>([])`, and pass it down through `Token` alongside the
other four. Step 8 below does the wiring.

`iconBounds` is a shared value, not a plain array. A plain array would be captured by closure when the worklet is built, and every later `onLayout` write would be invisible to the gesture.

Replace the menu branch of `onUpdate`:

```ts
      revealX.value = clamp(dragged, 0, MENU_WIDTH);

      if (revealX.value > REVEAL_THRESHOLD) {
        const idx = hitTest(e.absoluteY, iconBounds.value, HIT_PADDING);
        if (idx !== focusedIndex.value) {
          focusedIndex.value = idx;
        }
        phase.value = Phase.SCRUBBING;
      } else {
        focusedIndex.value = -1;
        phase.value = Phase.DRAGGING;
      }
```

The assignment is inside an inequality check. That is the discrete-transition boundary where M4 will attach a haptic. Writing the haptic outside this check would fire it on every frame.

- [ ] **Step 7: Commit on release**

Replace `onEnd`:

```ts
    .onEnd(() => {
      if (phase.value === Phase.SCRUBBING && focusedIndex.value >= 0) {
        runOnJS(commitAction)(focusedIndex.value);
      }
      reset();
    })
```

Add above the hook:

```ts
function commitAction(index: number) {
  console.log('[commit] icon', index);
}
```

Per the MVP scope cut, committing logs. It does nothing else.

- [ ] **Step 8: Mount the menu**

In `ParagraphInteractive`, render `EdgeMenu` as a sibling of the paragraph and wire `onBounds`:

```tsx
      <EdgeMenu
        revealX={revealX}
        focusedIndex={focusedIndex}
        onBounds={(b) => { iconBounds.value = b; }}
      />
```

Lift `iconBounds` alongside the other shared values in `ParagraphInteractive` and pass it into every `useHoldSlideGesture` call.

- [ ] **Step 9: Verify and commit**

```bash
npm run typecheck && npx jest
git add -A -- .
git commit -m "feat: add edge menu with worklet hit-testing"
```

- [ ] **Step 10: Device check**

The human confirms on both devices that the panel tracks the finger, that the focused icon is the one the finger is level with, and that releasing on an icon logs `[commit] icon N`. Report any constant offset between finger and focused icon, which would indicate the coordinate-space issue from Step 5.

---

### Task M4: Haptics

**Files:**
- Create: `app/lib/haptics.ts`
- Modify: `app/hooks/useHoldSlideGesture.ts`
- Modify: `app/components/ParagraphInteractive.tsx`

**Interfaces:**
- Consumes: everything from M3
- Produces: `triggerHaptic(kind)` where kind is `'armed' | 'reveal' | 'focusChange' | 'commit' | 'cancel'`

- [ ] **Step 1: Write the haptics wrapper**

Create `app/lib/haptics.ts`:

```ts
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
```

`selectionAsync` is the API both platforms intend for ticking through options. Do not substitute a light impact.

Cancel fires nothing. The source spec allows a subtle impact but warns against overdoing negative feedback. Start with silence and add only if the human asks.

This file imports `expo-haptics`, so it does not follow the `lib/` no-RN-imports rule. That rule exists to keep modules unit-testable, and haptics cannot be unit-tested. Do not add a test file for it.

- [ ] **Step 2: Fire on armed**

In `longPress.onStart`, after setting phase:

```ts
      runOnJS(triggerHaptic)('armed');
```

- [ ] **Step 3: Fire on threshold crossing, once**

Add a shared value to the hook:

```ts
  const hasRevealed = useSharedValue(false);
```

In the menu branch of `onUpdate`, before the hit test:

```ts
        if (!hasRevealed.value) {
          hasRevealed.value = true;
          runOnJS(triggerHaptic)('reveal');
        }
```

Reset it in `reset()`:

```ts
    hasRevealed.value = false;
```

The latch is required. Without it, a finger hovering near the 60px threshold retriggers the medium impact on every frame that crosses it.

- [ ] **Step 4: Fire on focus change**

Inside the existing `if (idx !== focusedIndex.value)` block:

```ts
          focusedIndex.value = idx;
          if (idx >= 0) runOnJS(triggerHaptic)('focusChange');
```

The `idx >= 0` check suppresses a tick when the finger leaves the icons entirely. Moving off the last icon should feel like nothing, not like another selection.

- [ ] **Step 5: Fire on commit**

In `onEnd`, beside the existing `commitAction` call:

```ts
        runOnJS(triggerHaptic)('commit');
```

- [ ] **Step 6: Remove the debug overlay**

Delete the `DebugOverlay` import and element from `ParagraphInteractive`. Keep `app/components/DebugOverlay.tsx` in the repository. It is useful if a later gate fails.

- [ ] **Step 7: Audit every runOnJS call**

```bash
grep -n "runOnJS" app/hooks/useHoldSlideGesture.ts
```

Every call must sit inside a conditional that can only become true on a discrete change. Any unconditional `runOnJS` inside `onUpdate` is a defect. Report the grep output to the orchestrator.

- [ ] **Step 8: Verify and commit**

```bash
npm run typecheck && npx jest
git add -A -- .
git commit -m "feat: add haptic feedback on discrete gesture transitions"
```

- [ ] **Step 9: HUMAN GATE — haptics on both devices**

The human checks each of the five moments on iPhone and on Android:

1. Arming produces a light tap.
2. Crossing the reveal threshold produces one medium tap, not a burst.
3. Each icon change produces a distinct tick.
4. Commit produces a success pattern.
5. Cancel is silent.

The central question is whether the focus tick feels immediate during a fast scrub. Record the iOS and Android answers separately. Do not proceed to M5 until the human answers.

---

### Task M5: Findings

**Files:**
- Create: `docs/FINDINGS.md`

**Interfaces:**
- Consumes: human gate results from M1, M3, and M4
- Produces: the project's deliverable

- [ ] **Step 1: Collect the exact test hardware**

Ask the orchestrator for the iPhone model and iOS version, and the Android model and OS version. Do not guess. The Android haptics result depends on whether the device has a real haptic engine, so an unnamed device makes the finding unusable.

- [ ] **Step 2: Write the findings document**

Create `docs/FINDINGS.md` following `.claude/skills/clear-technical-writing/SKILL.md`. Lead with the verdict. Use this structure:

```markdown
# Hold-and-Slide Edge Menu — Findings

## Verdict

[One paragraph. Does the pattern feel good enough to build on? Answer first.]

## Test hardware

| Platform | Device | OS version |
|---|---|---|
| iOS | ... | ... |
| Android | ... | ... |

## What we built

[Three sentences. What the interaction does.]

## Results by platform

### iOS
[Arming, reveal, scrub tick, commit. What each felt like.]

### Android
[Same four. State plainly whether the scrub tick survived.]

## The haptic engine question

[Did expo-haptics fall back to the Vibration API on the Android device?
What that means for the pattern's portability.]

## Tuning applied

[Any constant changed from its starting value, and why.]

## Limits of this result

[One device per platform. No custom native module. Icon actions log only.]

## If this continues

[What the next version would need. Keep it short.]
```

Record a negative result plainly if that is what happened. A pattern that fails on Android is a real finding about the pattern.

- [ ] **Step 3: Commit**

```bash
git add -A -- .
git commit -m "docs: add POC findings and platform verdicts"
```

---

## Self-review

**Spec coverage.** Stack and pins: M0. UI-thread state machine: M1. Gesture composition: M1. Hit-testing: M3. Haptics mapping: M4. Token layer: M2. Folder structure: M0 through M4. MVP scope cut: honoured, commit logs only. Validate the recognizer first: M1 precedes the menu. Both hazards from the design doc have explicit steps, at M3 Step 6 and M1 Step 5.

**Naming.** `armed`, `phase`, `revealX`, `focusedIndex`, `activeIndex`, `iconBounds`, `hasRevealed`, `triggerHaptic`, `hitTest`, `clamp`, `commitAction` are used identically in every task.

**Known soft spot.** M3 Step 5 assumes `onLayout` coordinates are comparable to `absoluteY`. Step 10 tests that assumption and names the fix if it is wrong.
