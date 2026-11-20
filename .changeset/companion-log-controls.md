---
'@uppy/companion': patch
---

Logs show control characters in logged data escaped (e.g. `\u0007`), colour codes included, so the data can't drive the terminal or hide other records. Tabs and the logger's own colours are kept. A multi-line message (such as an error stack) is logged one line per record, each with the usual prefix, up to 200 lines.
