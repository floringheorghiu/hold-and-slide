## Stack

- Expo (managed, TypeScript), SDK current stable
- `react-native-gesture-handler` v2 (Gesture API, not the old PanResponder)
- `react-native-reanimated` v3 (worklets)
- `expo-haptics`

Run in Expo Go on both a physical iPhone and physical Android device — no custom native modules needed for this scope. **Simulators/emulators don't produce haptics, so they can't validate this POC at all.** Test on hardware from day one.

## Core architectural decision: state lives on the UI thread

The whole premise of this pattern is that focus-change haptics feel instant. If gesture state lives in React state and round-trips through the bridge on every `touchmove`, the scrub will feel laggy and the POC will (correctly) look bad regardless of how good the pattern is.

So: gesture state machine lives in Reanimated shared values, evaluated inside worklets. React state is a *mirror*, updated via `runOnJS` only on discrete transitions (state change, focus index change) — never on every frame.

```
IDLE → PRESSING (dwell timer running)
     → ARMED (token highlighted, haptic fired)
     → DRAGGING (tracking translationX)
     → MENU_OPEN (revealed past threshold)
     → SCRUBBING (tracking focusedIndex, haptic per change)
     → COMMIT (release while focused) → IDLE
     → CANCEL (release before threshold, or drag right, or drag too far) → IDLE
```

Represent as a numeric enum in a `useSharedValue<number>`, not a JS object — cheaper to compare in worklets.

## Gesture composition

RNGH doesn't let one recognizer hand off mid-touch to another, so the standard recipe is `Gesture.Simultaneous(longPress, pan)`, gating what `pan` is *allowed to do* based on a shared `armed` flag set by `longPress`:

```ts
const armed = useSharedValue(false);
const phase = useSharedValue(0); // Phase enum
const revealX = useSharedValue(0);
const focusedIndex = useSharedValue(-1);

const longPress = Gesture.LongPress()
  .minDuration(380)
  .onStart(() => {
    armed.value = true;
    phase.value = Phase.ARMED;
    runOnJS(triggerHaptic)('armed');
  });

const pan = Gesture.Pan()
  .onUpdate((e) => {
    if (!armed.value) return;
    if (phase.value === Phase.ARMED || phase.value === Phase.DRAGGING) {
      revealX.value = clamp(-e.translationX, 0, MENU_WIDTH);
      phase.value = revealX.value > REVEAL_THRESHOLD ? Phase.MENU_OPEN : Phase.DRAGGING;
    }
    if (phase.value === Phase.MENU_OPEN || phase.value === Phase.SCRUBBING) {
      const idx = hitTestIcon(e.absoluteY);
      if (idx !== focusedIndex.value) {
        focusedIndex.value = idx;
        runOnJS(triggerHaptic)('focusChange');
      }
      phase.value = Phase.SCRUBBING;
    }
  })
  .onEnd(() => {
    if (phase.value === Phase.SCRUBBING && focusedIndex.value >= 0) {
      runOnJS(commitAction)(focusedIndex.value);
    }
    // reset all shared values, animate revealX back to 0
  });

const gesture = Gesture.Simultaneous(longPress, pan);
```

`pan` starts receiving updates from touch-down regardless, but does nothing until `armed` — this avoids fighting RNGH's recognizer lifecycle.

## Hit-testing for icon focus

Icons are stacked vertically in the revealed edge panel. Record each icon's center-Y and half-height into a plain array of shared values at layout time (`onLayout`, JS thread, written once). `hitTestIcon` is a worklet doing a linear scan (3–5 icons, no need for anything smarter) comparing `e.absoluteY` against each center ± a hit-zone padding larger than the visual icon (finger accuracy, not pixel accuracy).

## Haptics mapping

- Armed (token caught): `Haptics.impactAsync(Light)`
- Menu reveal crossing threshold: `impactAsync(Medium)`
- Per focus-change during scrub: `Haptics.selectionAsync()` — this is the API Apple/Android intend for exactly this "tick through options" feel
- Commit: `notificationAsync(Success)`
- Cancel: nothing, or a very subtle `impactAsync(Light)` — don't overdo negative feedback

**Known risk, not a code problem:** `expo-haptics` on Android falls back to the platform `Vibration` API on devices without a proper haptic engine (most non-Pixel/Samsung-flagship Android hardware). Expect the scrub tick to feel noticeably weaker or absent on some test devices. This is a legitimate finding to document, not something to engineer around in v1.

## Token/selection layer

Don't touch native text selection (per earlier point). Render the paragraph as an array of token components (`Pressable`-wrapped `Text`, `selectable={false}`, Android `android_disableSound`), each carrying an index. Long-press on a token sets `activeTokenId` and drives the highlight background via a shared value keyed by index — cheap to animate, no real selection API involved.

## Folder structure

```
/app
  /components
    GestureToken.tsx       — single word/phrase token, owns highlight state
    EdgeMenu.tsx            — reveal panel, renders icons from focusedIndex
    ParagraphInteractive.tsx— composes tokens + gesture + menu
  /hooks
    useHoldSlideGesture.ts  — the Gesture.Simultaneous composition above
  /lib
    haptics.ts               — triggerHaptic(kind) wrapper, single place to tune
    phase.ts                 — Phase enum + transition helpers
```

## MVP scope cut

Build only: one paragraph, one token type, one 3-icon menu, one platform test pass on each OS. Explicitly not in v1: multiple simultaneous menus, real text selection, icon actions doing anything beyond a console log / toast, persistence.

First thing to actually validate before writing the rest: mount just the `Gesture.Simultaneous` skeleton with `console.log` in place of haptics, confirm the armed→drag→menu-open transitions feel right on both devices. Haptics tuning is a second pass — don't build the whole menu before you know the gesture recognizer itself behaves.