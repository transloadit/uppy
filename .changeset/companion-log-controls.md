---
'@uppy/companion': patch
---

Logged data can no longer drive the terminal or hide other records: its escape sequences (such as colour codes) are dropped, and other control characters are shown escaped (e.g. `\u0007`). Tabs and the logger's own colours are kept. A multi-line message (such as an error stack) is logged one line per record, each with the usual prefix, up to 200 lines.
