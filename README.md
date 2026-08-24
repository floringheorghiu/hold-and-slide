# Hold-and-Slide Reading Controls

A prototype for starting text-to-speech from the passage you are actually
reading, instead of scrolling to a row of icons at the bottom of the screen.

Built with Expo and React Native. Runs in Expo Go on iOS and Android.

## The problem

Chat apps put playback controls in a row of icons at the end of each answer.
Those controls are anchored to the whole message. A reader's attention is
anchored to one passage. That mismatch has three consequences:

1. Starting playback on a long answer means scrolling to the end first.
2. There is often no pause. Only play.
3. There is no way to start reading from a chosen point in the text.

The native long-press menu does not help, because it offers text-selection
actions rather than playback ones.

## The interaction

Hold any word. Keep your finger down and slide toward the edge of the
screen. A menu appears under your thumb with three actions: play from here,
copy, and share. Move up and down to choose, and lift to commit. Slide back
the other way, or too far, and nothing happens.

Nothing about that requires scrolling anywhere. The controls come to the
passage instead of the passage going to the controls.

While audio plays, a floating pill holds pause and stop, so transport is
always one tap away. The sentence being read carries a soft tint, and the
page scrolls to keep the current paragraph under the header.

## Scope

This is a prototype for testing an interaction, not an app.

Built and validated:

- The hold-and-slide gesture, with haptics at each transition.
- An edge drawer with three passage-scoped actions.
- Text-to-speech using each device's stock voice, with play, pause and stop.
- Playback that starts from the word you held, including jumping mid-listen.
- A read-along highlight and paragraph auto-scroll.
- A Claude-style reading screen so the interaction is tested in the context
  it is meant for. The article displayed is about this prototype, so
  listening to it end to end is the demo.

Deliberately not built: voice selection or TTS configuration, real copy
targets beyond the clipboard, working thumbs-up/down/retry, any network or
model interaction.

## UI findings

**Focus tracking has to be instant, and the architecture is what makes it
so.** Gesture state lives in Reanimated shared values, evaluated in worklets
on the UI thread. React state is a mirror, updated only on discrete
transitions. Scrub focus kept up with the finger at every speed tested on
both devices. Haptics fire only on discrete changes — arming, crossing the
reveal threshold, each focus change, commit. Firing them per frame would
defeat the premise.

**Reveal distance is not panel width.** The panel's reveal was first mapped
across its own 220px width, so at the commit threshold it was only about a
quarter visible — nominally open, barely present. Decoupling the two fixed
it: a 130px drag now produces a full reveal, and the menu commits at 40px.

**Transport and passage actions are different jobs.** The drawer first held
play, copy and share. Once playback existed, there was no way to pause
without scrolling to the bottom row — recreating the exact problem the
drawer exists to solve. Adding pause and stop to the drawer fixed that, but
once a persistent floating control existed, the drawer no longer needed
them. The final split is two rules: the pill owns transport, the drawer owns
the passage.

**The same action means different things in different places, on purpose.**
The bottom row copies and shares the whole article. The drawer copies and
shares the one sentence containing the held word. Two matching scopes for
two different questions. That asymmetry is the point, not an inconsistency.

**A gesture can share an axis with scrolling if it does not share an
opening move.** Scrubbing is vertical and so is scrolling, but the gesture
begins with a horizontal slide. Activating the pan only after ~15px of
horizontal movement lets plain vertical drags fall through to the scroll
view untouched.

**Highlights need square corners.** Rounded corners on adjacent word tokens
leave visible gaps, so a highlighted sentence reads as speckling rather than
one continuous band.

## Platform notes

`expo-speech` has no pause on Android — only `stop()`. Playback therefore
speaks one sentence at a time and holds a cursor, so pause becomes
stop-and-remember and resume becomes speak-from-the-cursor. Behaviour is
identical on both platforms rather than missing on one. The cost is that
resuming replays the current sentence from its start.

That same cursor is what makes "play from here" possible: map the held word
to a character offset, map that to a sentence, set the cursor, play.

Full results, including hardware tested and bugs that were invisible to the
test suite, are in [`docs/FINDINGS.md`](docs/FINDINGS.md).

## A note on the Dependabot alerts

GitHub reports seven advisories against this repository. All of them are in
build tooling, and none are reachable in the running app.

| Package | Reached through | Runs when |
|---|---|---|
| `image-size` | Metro bundler | Build time, on this repo's own icon assets |
| `postcss` | `@expo/metro-config` | Web CSS processing |
| `uuid` | `@expo/ngrok`, `xcode` config plugin | Dev tunnel and native build only |

The `postcss` advisories require processing attacker-controlled CSS. This
project has no CSS and no web build. The `image-size` advisories are
denial-of-service through malformed images; the only images here are the
icons committed alongside the code. Neither `uuid` path ships in the app
bundle.

Severity describes the vulnerability, not the exposure. The question that
matters is whether attacker-controlled input can reach the affected code,
and for all seven it cannot: every input is a file in this repository,
processed on the developer's own machine at build time.

They are also mostly unfixable from here. The two `image-size` advisories
have no patch at all. `postcss` is pinned by `@expo/metro-config`, and
`uuid` arrives at two major versions behind through two different tools.
Forcing overrides would risk breaking the bundler to patch code that never
executes. These clear when Expo updates its own toolchain.

## Running it

Requires Expo Go on a physical device. Simulators cannot produce haptics, so
they cannot validate this prototype at all.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Use `--tunnel` if the phone and computer are
not on the same network.

Expo SDK 54 is pinned deliberately: Expo Go supports exactly one SDK
version, so the project targets whatever the test device can run.

## Layout

```
app/
  components/   tokens, edge drawer, floating controls, action row, chrome
  hooks/        useHoldSlideGesture, useSpeech
  lib/          pure logic: phase, geometry, sentences, drawer slots
  content/      the article
docs/           design specs and findings
```

`app/lib` holds no React Native imports, which is what makes it unit
testable. Everything with a right answer is tested there; everything else is
validated on hardware.
