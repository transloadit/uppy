---
"@uppy/dashboard": patch
"@uppy/status-bar": patch
"@uppy/locales": patch
---

Give upload action buttons more specific screen reader labels. The per-file remove, pause, resume and cancel buttons now include the file name (for example "Pause upload photo.jpg"), and the cancel, pause and resume buttons that act on every file now say "Cancel all uploads", "Pause all uploads" and "Resume all uploads". Visible text and tooltips are unchanged. Adds the `removeFileWithFilename`, `pauseUploadWithFilename`, `resumeUploadWithFilename`, `cancelUploadWithFilename`, `cancelAllUploads`, `pauseAllUploads` and `resumeAllUploads` strings.
