---
"@uppy/screen-capture": patch
---

Release the microphone and avoid duplicate screen and microphone prompts.

- Denying the screen picker now also stops the microphone, including one granted after the denial. Before, the browser kept showing the mic as in use.
- Calling `start()` twice, or taking a screenshot or starting a recording while the screen picker is open, now shows one screen picker and one microphone prompt. Before, each call opened its own, and the first screen and mic streams stayed live.
- Ending screen sharing from the browser is now also detected when the browser does not fire the stream's `inactive` event, by listening for the video track to end.
- Calling `stop()` while `startRecording()` waits for the screen picker no longer puts the plugin in an error state.
