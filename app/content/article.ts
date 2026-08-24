// The article deliberately explains the prototype it is displayed in.
// Listening to it end to end is the demo.

export const ARTICLE_TITLE = 'Reading controls that follow your finger';

export const ARTICLE = `Every long answer in a chat app ends the same way. A row of small icons sits at the very bottom: copy, share, play, thumbs up, thumbs down, retry. The play button is there, waiting, several screens below whatever you are actually reading.

That placement is the problem this prototype exists to solve.

The icons are anchored to the message. Your attention is on a passage. When you decide you would rather listen than read, you are usually somewhere in the middle of a long answer, and the control you need is nowhere near your finger. You scroll to the end, you press play, and playback starts from the beginning, not from the paragraph that made you want to listen in the first place.

There is no pause, either. Only play and, if you are lucky, stop. So a phone call, a doorbell, or a moment of not quite following forces you to start the whole thing again.

This prototype tries a different arrangement. Hold any word. Keep your finger down and slide toward the edge of the screen. A small menu appears under your thumb with three actions: play from here, copy, and share. Move your finger up and down to choose between them, and lift to commit. Slide back the other way, or too far, and nothing happens at all.

Nothing about that interaction requires you to scroll anywhere. The controls come to the passage instead of the passage going to the controls.

The technical premise is that this only works if it feels instant.

A gesture like this lives or dies on timing. If the highlight lags your finger, or if the tick you feel when moving between icons arrives a fraction of a second late, the whole thing feels broken in a way that is hard to name but easy to notice. So the gesture state does not live in the usual place. It lives on the interface thread, evaluated inside small functions that run alongside the animation system rather than in the application's main logic.

The consequence is that moving your finger never waits for anything. Position, phase, and which icon is focused are all computed where the frames are drawn. The application layer is told only about discrete events: the gesture armed, the menu opened, the focus changed, the user committed. Those are the only moments a haptic tick fires, and firing them on anything more frequent would defeat the point entirely.

Text to speech uses whatever voice the device already has. No cloud service, no model, no configuration.

Playback is deliberately broken into sentences rather than played as one long utterance. There is a practical reason for that. On Android the speech engine exposed by this toolkit offers no working pause at all, only stop. Speaking sentence by sentence, while remembering which sentence is current, turns pause into stop and remember, and resume into speak from the remembered position. The behaviour is then the same on both platforms rather than good on one and missing on the other.

The same cursor gives the prototype its most useful feature almost for free. Starting playback from a chosen word means finding the sentence that contains it and setting the cursor there. That is the entire mechanism behind play from here.

The honest cost is that resuming replays the current sentence from its start rather than from the exact syllable where you stopped. For listening, that turns out to be a feature more often than a flaw.

A few things are deliberately unfinished. Sentence detection is punctuation based, so an abbreviation will occasionally be mistaken for the end of a sentence. Thumbs up, thumbs down, and retry do nothing, because there is nothing behind them to do. The text you are reading is fixed rather than generated.

What is not unfinished is the part being tested. The gesture, the haptics, the reading controls, and the ability to start listening from the passage in front of you all work, on real hardware, on both platforms. Whether that arrangement is actually better than a row of icons at the bottom of the screen is not a question code can answer.

That one is for your thumb.`;
