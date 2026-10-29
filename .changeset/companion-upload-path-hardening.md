---
"@uppy/companion": patch
---

`uploadHeaders` now always win over client-sent headers of the same name, whatever their case. With `maxFileSize` set, streaming uploads now fail with `maxFileSize exceeded` once the source sends more bytes than the limit, also when it announced no size or a smaller one. With `streamingUpload: false`, pausing a tus upload while Companion is still downloading the file no longer crashes the process; the upload waits for resume (or the 10 minute paused timeout) as a paused transfer does. A tus upload that is paused or canceled no longer sends further requests, so a cancel that races a resume can no longer create a new upload or crash the process. The daily clean-up job no longer deletes temp files that an upload in progress in the same process is still using; Companion processes that share one `filePath` still can't see each other's uploads, but a temp file deleted under an upload now fails that upload instead of crashing the process.
