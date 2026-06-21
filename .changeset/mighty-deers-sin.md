---
"@uppy/companion-client": major
"@uppy/companion": major
---

Send token using websocket instead of window.opener.
Breaking in `@uppy/companion-client` because it needs newest version of Companion in order to work.
Breaking in `@uppy/companion` because `companion.socket()` now requires `companionOptions` to be passed as the second argument.
