---
"@uppy/companion": patch
---

WebDAV: support ownCloud Infinite Scale (oCIS) public share links. When a `/s/<token>` link isn't served at the Nextcloud/ownCloud 10 endpoint (`/public.php/webdav/`), Companion now tries oCIS's `/dav/public-files/<token>` once while connecting, and remembers which one worked for the session.
