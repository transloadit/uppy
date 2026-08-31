---
'@uppy/companion': patch
---

Match the `uploadUrls` and `server.validHosts` allowlists literally.

**This is a security fix, and it changes behaviour: if any allowlist entry is
written as a regular expression, it stops matching until you anchor it with
`^`.** See the migration below. It ships as a patch so that the fix reaches
everyone, but check your config before upgrading.

String entries used to be compiled into regular expressions and matched
anywhere in the value, so any destination that merely *contained* an allowed
URL passed validation — `uploadUrls` is the only gate in front of the upload
leg, so this let a caller point Companion at an internal host
([#6480](https://github.com/transloadit/uppy/issues/6480)).

A string entry is now compared literally: for `uploadUrls` the origin must be
identical and the path must match at a path boundary (so an allowed endpoint
still admits the upload id appended to it), and for `validHosts` the hostname
must match exactly, case-insensitively.

To keep matching with a pattern, pass a `RegExp` when configuring Companion
programmatically. Standalone config can only hold strings, so an entry that
starts with `^` is read as a pattern there — in `COMPANION_UPLOAD_URLS` and
`COMPANION_DOMAINS`, or in the JSON config file:

```diff
-COMPANION_UPLOAD_URLS="https://api2-(\w+)\.example\.com/files/"
+COMPANION_UPLOAD_URLS="^https://api2-(\w+)\.example\.com/files/"

-COMPANION_DOMAINS="(\w+).example.com"
+COMPANION_DOMAINS="^(\w+)\.example\.com$"
```

Patterns are matched as written, so anchor the tail end too where it matters:
`^(\w+)\.example\.com` still matches `sub.example.com.evil.com`. Companion
warns at startup about a `RegExp` with no `^`. A value that starts with `^` is
not split on `,`, so combine several patterns with `|` rather than listing
them.

An entry left as an unanchored pattern is now a literal that matches nothing,
and Companion cannot detect that — it is a valid URL or hostname as far as it
can tell. It fails closed, so uploads and OAuth redirects break visibly rather
than going somewhere unintended.

Also: `validHosts` no longer matches a host carrying a port against an entry
without one, and both options widen to `(string | RegExp)[]`.
