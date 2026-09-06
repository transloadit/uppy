---
"@uppy/companion": patch
---

Fix Unsplash downloads failing since `unsplash.com` was put behind bot
protection. `download()` streamed `links.download`, which points at
`unsplash.com/photos/{id}/download`, so the bot challenge page ended up being
piped into the upload instead of the image.

Companion now downloads the photo from the `url` returned by the
`download_location` endpoint — the request it already made to increment the
download count for attribution — which points at `images.unsplash.com` and is
Unsplash's documented download path.
