---
'@uppy/companion': patch
---

- Google Drive: list shared drives one page per request instead of all of them at once (in the root listing, more shared drives now arrive with "load more"), and escape the folder ID in the Drive query.
- Box and OneDrive: validate the folder path before any request starts.
- S3 provider: downloads use their own HTTP client, so imports waiting to be read can't use up the connections needed for browsing and other requests.
- S3 multipart: reject empty object keys, keys over 1024 bytes and upload IDs over 2048 characters before signing, and stop when S3 returns an invalid or non-advancing part-listing cursor.
- Thumbnails: release the provider's stream when the browser has already gone.
