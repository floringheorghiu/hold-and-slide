# Phase 2 — Passage-Anchored Reading Controls

Date: 2026-08-24
Builds on: `2026-08-21-hold-slide-edge-menu-design.md` (phase 1, complete)

## The problem this solves

In the Claude mobile app the text-to-speech control sits in a row of action
icons at the very bottom of an answer. Three consequences, all reported from
daily use:

1. Starting playback on a long answer means scrolling to the end first.
2. There is no pause. Only play.
3. There is no way to start reading from a chosen point in the text.

The native long-press menu does not help, because it offers text-selection
actions rather than playback ones.

Phase 1 built and validated a gesture that could fix this: hold a word, slide
left, scrub a vertical menu, release. Phase 2 applies it to the actual problem.

The controls people need are anchored to the WHOLE MESSAGE, while attention is
on a PASSAGE. That mismatch is the bug. The edge drawer fixes it by putting
passage-scoped actions under the finger that is already pointing at the passage.

## Confirmed constraints

`expo-speech` ~14.0.8 is bundled in Expo SDK 54, so it works in Expo Go with no
extra native tooling. Stock system voice, no configuration.

`Speech.pause()` and `Speech.resume()` are NOT available on Android. This is
stated in the module's own type definitions. `Speech.stop()` works on both.

This blocks the requested Pause button on Android if playback is a single
utterance.

## Core decision: sentence cursor

Playback speaks ONE SENTENCE AT A TIME, holding a cursor of which sentence is
current. `onDone` advances the cursor and speaks the next.

| Control | Behaviour |
|---|---|
| Play | speak sentence at cursor, advance on done |
| Pause | `stop()`, keep cursor |
| Resume | speak from cursor |
| Stop | `stop()`, cursor back to 0 |

Pause becomes stop-and-remember. Behaviour is then identical on both platforms
rather than degraded on one.

Honest cost: resuming replays the current sentence from its start, not from the
exact word. For listening this is acceptable and arguably preferable.

The same cursor delivers the third feature for free. "Start reading from here"
is: map the held word to a character offset, map that offset to a sentence
index, set the cursor, play. No extra mechanism.

## Spike result

Long-press-and-drag coexists with vertical scrolling. `Gesture.Pan` with
`.activeOffsetX([-15, 15])` claims the touch only after roughly 15px of
HORIZONTAL movement, so plain vertical drags fall through to the ScrollView as
normal scrolling, while the slide-left that opens the menu claims the gesture at
exactly the right moment. Once activated the pan keeps receiving vertical
updates, which the scrub needs.

`failOffsetY` must never be set. It would kill the pan the moment the finger
moved vertically, which is precisely what scrubbing does.

Use `ScrollView` from `react-native-gesture-handler`, not from `react-native`.

Confirmed on device: scrolling works and the menu still opens.

## Scope

In:

- A screen that reads as the Claude mobile app: light theme, serif body text,
  a header, a bottom action row, a reply bar.
- Text long enough that scrolling to the bottom is a real cost.
- Bottom action row with six actions, matching the real app: copy, share, play,
  thumbs up, thumbs down, retry.
- Edge drawer with three actions: play-from-here, copy, share. Chosen over
  mirroring all six because three keeps hit targets large, and because these
  are the actions that are meaningfully passage-scoped rather than
  message-scoped.
- Working text-to-speech using the device's stock voice, with play, pause, and
  stop. While playing, pause and stop are shown. When stopped, play returns.
- Playback that can start from the word the user held.

Out:

- Voice selection, rate, pitch, or any TTS configuration.
- Real copy or share behaviour beyond a toast or log.
- Thumbs up, thumbs down, and retry doing anything.
- Any network or model interaction. The text is static content.
- Word-level playback highlighting, unless it falls out cheaply.

## Known limitations to record, not fix

Sentence splitting is punctuation-based and will mis-split abbreviations such
as "Dr." or "e.g.".

Resume restarts the current sentence rather than resuming mid-word.

Tokens are split on whitespace, so punctuation attaches to the preceding word.

The icon panel currently has no background, so icons overlay the text.

One gesture recognizer per word. Fine at the current size; a single container
recognizer with hit-testing would be the fix if it becomes a performance
problem at longer texts. Not pre-emptively changed.

## Milestones

| # | Deliverable | Gate |
|---|---|---|
| P1 | Claude-styled screen: light theme, serif body, header, long text, bottom action row, reply bar. No TTS. | Human: does it read as the real app? |
| P2 | `useSpeech` hook over `expo-speech` and the sentence cursor. Bottom row play/pause/stop wired. | HUMAN GATE: playback, pause, stop on BOTH devices |
| P3 | Drawer switched to play-from-here, copy, share. Release on play sets the cursor from the held word. | HUMAN GATE: does it read from the right place? |
| P4 | Findings covering phase 1 and phase 2, both platforms. | Verdict stated plainly |

## Verification protocol

Unchanged from phase 1. Orchestrator reads the diff, runs `tsc --noEmit` and
jest, audits worklet discipline, then hands to the human. A gate passes only
when the human says so.

Android pause is the specific thing to test hardest at P2, because it is the
constraint that shaped the architecture.
