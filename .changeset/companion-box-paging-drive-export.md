---
"@uppy/companion": patch
---

Box: the next page of a folder listing now stays in that folder, instead of listing the root folder, and a folder whose size is an exact multiple of the page size no longer asks for an extra, empty page. Google Drive exports downloaded through their export link, and Facebook, Unsplash (including its download-attribution request) and Zoom downloads, now honour `allowLocalUrls` like every other download. These downloads now also use the protected client's timeouts (30 s until the response starts; up to 10 minutes for Google Drive exports, which Google converts before answering) and, when `allowLocalUrls` is off, resolve hostnames through DNS servers instead of `dns.lookup`.
