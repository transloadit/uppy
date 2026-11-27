---
'@uppy/companion': patch
---

Use runtime OAuth credentials when refreshing tokens, and support standalone JSON configuration through `COMPANION_CONFIG_JSON` or `COMPANION_CONFIG_FILE`. Fix native Transloadit Storage moves for Unicode paths and the file library. Let Uppy close successful OAuth popups after receiving the token (the popup closes itself after a minute otherwise), and bound retained callback results with fail-closed Redis delivery.
