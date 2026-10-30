---
"@uppy/companion": patch
---

Report the file size for Google Picker (Drive) imports. Drive doesn't send a `Content-Length` for `alt=media` downloads, so Companion now falls back to the `size` from the file metadata, and the client shows the total and the percentage instead of "X of unknown".
