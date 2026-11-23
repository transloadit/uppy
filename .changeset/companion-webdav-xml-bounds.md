---
"@uppy/companion": patch
---

Companion now checks WebDAV folder listings before parsing them, and rejects responses with very deep nesting, too many elements or attributes, or a DTD. It asks WebDAV servers for uncompressed listings and caps a listing at 5 MiB, and it rejects WebDAV URLs deeper than 32 folders.
