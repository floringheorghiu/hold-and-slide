# Hold-and-Slide Edge Menu — Reconciled Design

Date: 2026-08-21
Source spec: `Cross-platform_app_prototype.md` (authoritative for architecture)
This document: records deltas against that spec, and the execution plan.

## What this POC is testing

Whether a "long-press a word → slide left to reveal an edge menu → scrub
vertically through icons → release to commit" gesture feels good, where
"feels good" is defined by haptic latency. The hypothesis under test is
that focus-change haptics must fire from the UI thread to feel instant.

A negative result is a valid outcome. The deliverable is a judgement, not
a shipping feature.

## Deltas from the source spec

The source spec's architecture is adopted unchanged: gesture state in
Reanimated shared values, evaluated in worklets; React state as a mirror
updated via `runOnJS` only on discrete transitions; numeric Phase enum;
`Gesture.Simultaneous(longPress, pan)` gated by an `armed` shared value.

Three deltas:

### D1 — Expo SDK 54, and Reanimated 4 rather than 3

The SDK is chosen by the test device, not by us. Expo Go supports exactly
one SDK version. The human's iPhone runs Expo Go 54.0.2 and the App Store
offers no update, so his iOS version caps him there. The project targets
whatever his phone can run.

Expo SDK 54 (`bundledNativeModules.json`) pins:

| Package | Version |
|---|---|
| react-native | 0.81.5 |
| react-native-reanimated | ~4.1.1 |
| react-native-worklets | 0.5.1 |
| react-native-gesture-handler | ~2.28.0 |
| expo-haptics | ~15.0.8 |

SDK 54 still ships Reanimated 4 with the separate worklets package, so the
spec's v3 pin is still the one real delta. The architecture is unaffected.

Expo Go ships fixed native binaries, so these are the only loadable
versions. Reanimated 3 is unavailable without abandoning Expo Go, which
would contradict the spec's own "no custom native modules" constraint.
The constraint wins over the version number.

Note the spec's `gesture-handler` v2 pin is CORRECT — SDK 57 pins 2.32.0.
Reanimated is the sole version delta.

Impact is confined to imports: `runOnJS` and the `'worklet'` directive
come from `react-native-worklets`; `useSharedValue`, `useAnimatedStyle`,
`useDerivedValue`, `withTiming` stay in `react-native-reanimated`. The
Gesture API used by the spec's code sample is unchanged.

Install via `npx expo install`, never `npm install`, so pins are honored.

### D2 — Both platforms validated on hardware

An iPhone and an Android device are both available. Every gate is
therefore validated on real hardware on both platforms, as the source
spec requires. No simulator or emulator result counts toward a gate:
they cannot produce haptics, and haptic latency IS the thing under test.

This makes the spec's predicted Android finding testable rather than
hypothetical. `expo-haptics` on Android falls back to the platform
Vibration API on devices without a real haptic engine, which should make
the per-focus scrub tick feel weaker or vanish entirely. M5 must report
what the specific test device actually did, and name the device and OS
version — "Android" is not a result, since the outcome is hardware
dependent by nature.

Record iOS and Android verdicts separately. They may legitimately
disagree, and a pattern that works on one platform and not the other is a
real finding about the pattern, not a defect to hide.

### D3 — On-device debug overlay replaces console.log for M1

The spec calls for `console.log` in place of haptics during the first
gesture-skeleton validation. Reading Metro logs is impossible while both
hands are performing a long-press-and-scrub on a physical phone. Same
information, rendered on-device: a fixed overlay showing `phase`,
`revealX`, and `focusedIndex`, driven by `useDerivedValue` so it costs no
bridge traffic. Removed at M4.

## Known correctness hazards

Two traps to audit for explicitly, because both fail silently:

1. **Stale icon geometry.** `onLayout` writes on the JS thread;
   `hitTestIcon` reads on the UI thread. Icon bounds MUST land in shared
   values. A plain JS array is captured by closure at worklet-creation
   time, so hit-testing silently targets stale coordinates.
2. **The `armed` guard is load-bearing.** RNGH recognizers cannot hand off
   mid-touch, so `pan.onUpdate` fires from touch-down. `if (!armed.value)
   return;` is required behavior, not defensive style.

A third, softer hazard: any `runOnJS` reached on every `onUpdate` frame
rather than on a discrete transition invalidates the entire premise of the
POC. This is the primary thing code review must catch.

## Scope

Per the source spec's MVP cut, unchanged. Build: one paragraph, one token
type, one 3-icon menu. Not in v1: multiple simultaneous menus, real text
selection, icon actions beyond a console log, persistence.

## Execution plan

Sequenced so the gesture recognizer is proven before the menu is built,
per the source spec's closing instruction.

| # | Deliverable | Exit criteria |
|---|---|---|
| M0 | Expo TS scaffold, deps via `npx expo install`, boilerplate stripped | Boots in Expo Go on the iPhone; `tsc --noEmit` clean |
| M1 | `lib/phase.ts`, `hooks/useHoldSlideGesture.ts`, debug overlay. No menu, no haptics | HUMAN GATE: armed to drag to menu-open feels right on BOTH devices |
| M2 | `components/GestureToken.tsx`, `components/ParagraphInteractive.tsx` | Token highlight tracks long-press; no per-frame runOnJS |
| M3 | `components/EdgeMenu.tsx`, onLayout bounds to shared values, `hitTestIcon` worklet | Hazard 1 audited; focus tracks finger accurately on device |
| M4 | `lib/haptics.ts`, 5-way mapping, overlay removed | HUMAN GATE: haptics feel correct on iPhone AND Android; note divergence |
| M5 | Findings doc: separate iOS and Android verdicts, test devices named | Verdict on the hypothesis, stated plainly |

## Verification protocol

Each task is implemented by the sub-agent, then verified by the
orchestrator before it reaches the human:

1. Read the diff.
2. `npx tsc --noEmit`.
3. Worklet discipline audit: no `runOnJS` in an `onUpdate` hot path except
   on a genuine discrete change; shared values used for cross-thread data.
4. Hand to human for on-device feel at M1 and M4, on both platforms.

A gate is passed only by the human saying so. "Typechecks" is not "works".
