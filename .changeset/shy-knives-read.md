---
"@uppy/golden-retriever": minor
---

Store the recovery snapshot in IndexedDB instead of localStorage, falling back to localStorage when IndexedDB is unavailable. This stops large Transloadit assemblies from exceeding localStorage's ~5MB quota (which surfaced as an "Upload failed … exceeded the quota" error). (#6280)
