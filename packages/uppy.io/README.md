# Uppy.io

Website and documentation for [uppy.io](https://uppy.io).

Code for [uppy.io/blog](https://uppy.io/blog) lives in this repo.  
Code for [uppy.io/docs](https://uppy.io/docs/quick-start) lives in
[github.com/transloadit/uppy](https://github.com/transloadit/uppy).

## Developer guide

If you want to edit [uppy.io/blog](https://uppy.io/blog), edit the files in this
repo.

If you want to edit [uppy.io/docs](https://uppy.io/docs/quick-start), then you
should:

1. Clone both the **uppy** repo and **uppy.io** repo.

2. Then, from your `uppy.io` clone, run:

   ```sh
   ln -s /path-to-your-uppy-repo/docs docs
   ```

   Now, treat **/uppy/docs** as your working directory, but run the build/lint
   scripts from your **/uppy.io** directory - **/uppy.io** will pick up your
   changes.

### Install Dependencies

```sh
corepack yarn
```

### Local Development

```sh
corepack yarn dev
```

This command builds **/uppy/docs** and **/uppy.io**, and shows them in a
browser. Most changes are reflected live without having to restart the server.

### Lint

```sh
corepack yarn run format
corepack yarn lint
```

This command lints **/uppy/docs** and **/uppy.io**.

### Build

```sh
corepack yarn build
```

This command generates static content into the `build` directory and can be
served using any static contents hosting service.

### IndexNow notifications

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

---

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern
static website generator.
