# example-tus-min

Minimal reproduction for [issue #6287](https://github.com/transloadit/uppy/issues/6287):
`@uppy/core` + `@uppy/tus` (local file uploads only — no Dashboard, no
providers, no Companion) talking to a [`tus-node-server`](https://github.com/tus/tus-node-server)
backend (`@tus/server` + `@tus/file-store`).

The server rejects any file whose name ends in `.bin` with `HTTP 403` and a JSON
body, mimicking the "BIN content type is disallowed" server in the bug report.
So one running server reproduces both paths:

- a **normal file** → success path
- a **`*.bin` file** → error path (#6287)

## Run

From the repo root, make sure the workspace packages are built so the example
resolves the local `@uppy/tus`:

```bash
yarn install
yarn workspace @uppy/tus build   # or `yarn build` for everything
```

Then start the client + server together:

```bash
yarn workspace example-tus-min start
```

- client: <http://localhost:5173>
- tus server: <http://127.0.0.1:1080/files>

Uploaded files land in `examples/tus-min/uploads/` (gitignored).

## What to look for

Open <http://localhost:5173> and watch the on-page log (and the devtools
console). `window.uppy` is exposed for poking around.

### Error path — pick a `*.bin` file (e.g. rename anything to `test.bin`)

| | without the fix (`main`) | with the fix |
| --- | --- | --- |
| `upload-error` `response` | `undefined` | `{ status: 403, body: { xhr } }` |
| `response.body.xhr.responseText` | n/a | the server's JSON message |

### Success path — pick any normal file

| | without the fix (`main`) | with the fix |
| --- | --- | --- |
| `upload-success` `response.body.xhr.status` | `0` (xhr was reset) | `204` |

> `response.status` is always `200` on success because the Tus plugin hardcodes
> it — the tell for the success-path bug is specifically
> `response.body.xhr.status === 0`.

To compare buggy vs. fixed behavior, rebuild `@uppy/tus` on each branch
(`yarn workspace @uppy/tus build`) and restart.
