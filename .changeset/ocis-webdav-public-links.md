---
"@uppy/companion": patch
---

@uppy/companion: support oCIS (ownCloud Infinite Scale) public share links in the WebDAV provider

The WebDAV provider hard-coded the `/public.php/webdav/` endpoint when resolving `/s/<token>` public share links. That works for Nextcloud and ownCloud 10, but oCIS serves public shares at `/dav/public-files/<token>`, so importing an oCIS public link failed with `Invalid response: No root multistatus found`.

Companion now probes the known public-share WebDAV endpoints and uses the first that responds as WebDAV, caching the resolved endpoint on the session. This fixes oCIS public links without affecting Nextcloud / ownCloud 10.

Fixes #6007.
