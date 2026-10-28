---
"@uppy/companion": patch
---

Hand each OAuth token only to the browser session whose OAuth flow produced it, and only once; logout now clears the whole OAuth session, and custom OAuth providers now always get Grant's state check, which they can no longer turn off. Resolve client-chosen host names with DNS queries instead of the shared libuv thread pool (unless `allowLocalUrls` is set), trim S3 folder names in linear time, and keep credentials endpoint error details out of responses. tus transfers that stay paused for 10-12 minutes, or whose source sends nothing for 2-4 minutes, are now abandoned with an upload error: a remote file paused for longer than that has to be retried instead of resumed. Waiting for the tus server to answer does not count as a stall. The DNS queries go to the system's DNS servers as read at startup, and do not use `/etc/hosts` or search domains; a name gets up to 5 seconds, and once one address family has answered, the other gets 300 ms more.
