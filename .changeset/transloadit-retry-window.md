---
"@uppy/transloadit": patch
---

Extend the default Tus upload retry delays to `[1000, 2000, 3000, 5000, 10000, 15000, 20000, 30000]`, totaling 86 seconds of waits. Retry brief interruptions sooner and give a server or load balancer time to recover during a restart lasting up to about a minute and a half, with later attempts spaced out to reduce load.

Uploads using the default now wait longer before failing when a server stays unavailable. Custom `retryDelays` arrays, including `[]` to disable retries, continue to override the default.

The shared queue's HTTP 429 pauses also use these delays, so the first rate-limit pause is shorter and more pauses are available before that shared sequence is exhausted.
