# Uppy.io

Website and documentation for [uppy.io](https://uppy.io).

## Developer guide

See the
[contributing guide](https://github.com/transloadit/uppy/blob/main/.github/CONTRIBUTING.md#uppyio-website).

## IndexNow notifications

After a successful production deployment from `main`, GitHub Actions notifies
[IndexNow](https://www.indexnow.org/documentation) about added, edited and
removed sitemap URLs. The first run establishes a baseline without submitting
historical pages. Preview builds and deployments from other branches do not
submit URLs.

`scripts/indexnow.mjs` compares rendered page content and search metadata,
excluding shared navigation, footer, presentation and bundle references. It
falls back to sitemap URL and Git-derived `lastmod` differences when rendered
HTML is unavailable (including the client-only examples page), while still
comparing head metadata. The public ownership key in `static/indexnow.txt` needs
no secret or paid service. The script verifies the deployed key before sending
up to 10,000 URLs per request. HTTP 202 means the URLs were accepted with key
validation still pending; acceptance does not guarantee indexing.

The production snapshot and pending notifications live in an Actions cache and a
90-day Actions artifact; `/indexnow-state.json` provides another recovery copy.
Snapshot generations prevent stale cache restores from dropping newer pending
notices. The public file contains only sitemap URLs and fingerprints. Failed
notifications remain pending for the next production deployment. Recovery may
repeat accepted URLs. Timeouts and other IndexNow failures produce warnings and
never fail a deployment. No submission happens during `yarn build` or
`yarn test`.

Fallback timestamps reflect a page’s own Git source history; updates confined to
imported client code or assets may be absent from the sitemap diff.

Repeated 400/403/422 responses need the ownership key or payload corrected; the
queue stays intact instead of silently discarding rejected updates.
