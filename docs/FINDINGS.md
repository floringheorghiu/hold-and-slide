# Findings — Hold-and-Slide Reading Controls

## Verdict

The pattern works. Hold a word, slide left, scrub a vertical menu, release.
It runs on both an iPhone and a mid-range Android phone, at full article
length, with haptics that feel immediate. Text-to-speech built on top of it
solves the real problem: playback controls that follow your attention
instead of sitting at the bottom of a long answer. Two devices confirmed
this, one iPhone and one Android phone. Every result below is one device per
platform, not a platform-wide claim.

## Test hardware

| Platform | Device | OS |
|---|---|---|
| iOS | iPhone 17 | 26.6.1 |
| Android | Redmi Note 11 Pro | 13 |

Expo SDK 54, Expo Go. Reanimated 4.1.7, gesture-handler 2.28.0, expo-speech
14.0.8.

## What this prototype tests

Chat apps put playback controls in a row of icons at the bottom of each
answer. The controls are anchored to the whole message. A reader's attention
is anchored to one passage. That mismatch means starting playback on a long
answer means scrolling to the end first, and there is no way to start
reading from the middle.

This prototype answers two questions. Does a hold-and-slide gesture feel
good enough to build on? And does moving playback controls to the passage
under your finger actually fix the mismatch?

## Phase 1 — the gesture

The gesture works on both platforms. Hold a word for 380ms, it arms. Slide
left, a menu reveals. Move a finger up and down, focus tracks between three
icons. Release, the focused action commits.

The 380ms arm delay felt right without retuning.

The reveal threshold needed retuning, and the reason is a real design bug,
not a preference. The panel's reveal was originally mapped across its own
220px width. At the 60px commit threshold, the panel was only about a
quarter visible — nominally open, but barely present on screen. The fix
decoupled drag distance from panel width: dragging 130px now produces a
full reveal, and the menu commits at 40px, where roughly a third of the
panel is already visible.

Focus tracking during the scrub "keeps up perfectly" at any speed, in the
human's words. This is the central architectural claim under test: gesture
state lives in Reanimated shared values, evaluated in worklets on the UI
thread, so finger movement never waits on the JavaScript thread. The result
held at every scrub speed tested.

All five haptic moments felt correct on both devices: arming, crossing the
reveal threshold, each focus change during a scrub, commit, and cancel
(silent, by design).

### The haptics result needs an honest limit stated

The source design spec predicted that `expo-haptics` would degrade to a
crude vibration on Android hardware without a real haptic engine, and named
most non-Pixel, non-Samsung-flagship devices as the likely failure case. The
Redmi Note 11 Pro is squarely in that category. The predicted degradation
did not happen — the scrub tick felt distinct and immediate.

This is one counterexample on one mid-range device. It refutes "most
Android hardware fails this." It does not establish "all Android hardware
works." A different mid-range device, or a different Android version, could
still degrade.

## Phase 2 — reading controls

Text-to-speech works on both platforms, using each device's stock system
voice. No cloud service, no model, no voice configuration.

### The headline result: pause works on Android

`expo-speech` has no pause API on Android — `Speech.pause()` and
`Speech.resume()` are documented as unavailable there, only `Speech.stop()`
works. The fix was architectural, not a workaround: playback speaks one
sentence at a time and holds a cursor of which sentence is current. Pause
becomes stop-and-remember. Resume becomes speak-from-the-remembered-cursor.
Behaviour is then identical on both platforms, rather than good on one and
missing on the other.

State the cost plainly: resuming replays the current sentence from its
start, not from the exact word where playback stopped. For listening, that
turns out to read as a feature more often than a flaw.

Play-from-a-held-word works, including jumping playback mid-listen from one
paragraph to a different one entirely. Copy and share both work.

### The asymmetry is the project's thesis

Copy and share behave differently depending on where you trigger them, and
that difference is deliberate, not an inconsistency to fix. The bottom
action row acts on the whole article — that is what "the message" means to
those controls. The edge drawer acts on the one sentence containing the
held word — that is what "the passage" means to it. The mismatch this
prototype set out to fix was controls anchored to the message while
attention sits on a passage. Two matching scopes for two different
questions is the fix, not a bug to reconcile into one behaviour.

### Read-along highlight and auto-scroll

The sentence currently being read carries a pale warm tint that moves with
playback. Holding a word still shows the blue hold-highlight on top of that
tint. When reading crosses into a new paragraph, the page scrolls so that
paragraph lands just below the header. Both worked on both devices.

## Design decisions that changed under testing

These are the useful part of this project, because each one was wrong once
and testing caught it.

**The drawer's contents changed twice.** It started as three fixed actions:
play, copy, share. Once speech landed, the drawer briefly held four
possible actions to add pause and stop — but with no persistent way to
pause, the user had to scroll to the bottom row anyway, recreating the
exact problem the drawer exists to solve. Adding pause and stop to the
drawer fixed that. Then persistent floating playback controls were built on
top, and once those existed, the drawer no longer needed pause and stop at
all — it returned to three fixed actions. The final split is two clean
roles instead of one overloaded one: the floating pill owns transport
(pause, stop, always available while audio plays), the drawer owns the
passage (jump here, copy this, share this, always the same three).

## Bugs worth recording

These were invisible to typecheck and to the test suite. Each one only
surfaced on a real device, or after a component finally read a value that
had been silently wrong for a while.

**`withTiming` on a colour string renders nothing, in Reanimated 4.1.7.**
The word-highlight animation compiled, typechecked, and produced no visible
colour change on device. The fix: drive a numeric progress value with
`withTiming`, and turn that number into a colour with `interpolateColor`.
Every colour transition in this app uses that pattern now — no colour
string is ever passed to `withTiming` directly.

**A boolean cancel flag could not tell two situations apart.**
`Speech.stop()` is asynchronous, and on Android it can itself trigger the
`onDone` callback instead of `onStopped`. A boolean guard, cleared the
moment a new utterance starts, cannot distinguish "this callback belongs to
a cancelled utterance" from "cancelled, then a new one already started" — a
late callback from the old utterance could pass the guard and advance the
cursor past the sentence just begun. A generation counter fixed it: every
utterance captures its own generation number, and a callback whose
generation is stale is ignored no matter when it arrives.

**`phase` could get stuck at PRESSING after a scroll.** The long-press
recognizer optimistically set `phase` to PRESSING on every touch, including
touches that turned into an ordinary scroll rather than a hold. The reset
that clears `phase` was only reachable through paths guarded by whether the
gesture had armed, so a touch that never armed left `phase` stuck at
PRESSING permanently. This bug existed from the first gesture milestone and
was invisible until a much later component finally read `phase` for a
purpose other than driving the debug overlay, which had since been removed.

## Known limitations, deliberate

- Sentence splitting is punctuation-based. It mis-splits abbreviations such
  as "Dr." or "e.g." into false sentence boundaries.
- Resume replays the current sentence from its start, not from the word
  where playback stopped.
- Tokens split on whitespace, so punctuation attaches to the preceding
  word.
- Thumbs up, thumbs down, and retry are mocked. They flash and do nothing
  else.
- The article is static content, not generated or fetched.
- Manual scrolling is overridden the next time reading crosses into a new
  paragraph. Scrolling away mid-sentence does not suppress the next
  auto-scroll.
- One gesture recognizer exists per word. At 698 words, on both test
  devices, this stayed smooth. It is not known to scale past that — a
  single container recognizer with hit-testing is the fix if a longer
  article shows jank, and was deliberately not pre-emptively built.

## If this continues

Test on more Android hardware. One mid-range device refuted the predicted
haptics failure; it takes several more, across manufacturers and Android
versions, to know how common that failure actually is.

Fix sentence splitting to handle common abbreviations, or accept the
mis-split rate and move on.

Decide whether resume-from-sentence-start is the permanent behaviour or a
placeholder for resume-from-word, which would need mid-utterance position
tracking that `expo-speech` does not currently expose.

Test at longer article lengths to find where the one-recognizer-per-word
approach actually breaks, rather than assuming it does at some larger size.

Wire the mocked actions — thumbs up, thumbs down, retry — to something
real, once there is a real backend to wire them to.
