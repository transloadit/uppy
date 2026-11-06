---
'@uppy/companion': patch
---

Use runtime OAuth credentials when refreshing tokens, map provider errors before logging, and support standalone JSON configuration through `COMPANION_CONFIG_JSON` or `COMPANION_CONFIG_FILE`. Fix native Transloadit Storage moves for Unicode paths and the file library. Let Uppy close successful OAuth popups after receiving the token, and bound retained callback results with fail-closed Redis delivery.
