/**
 * The brief we hand to a coding agent. It is the same advice as the docs, but
 * ordered as instructions and front-loaded with the things agents get wrong:
 * the CSS paths, the subpath imports, the v6 S3 signing modes, and
 * constructing Uppy in a render body. Kept as one string so the copy button hands over exactly what is on
 * screen.
 */
export const agentPrompt = `# Add Uppy File Uploader

Set up Uppy (v6) by following the official integration guide for this project's framework, then wire up an uploader backend.

## Step 1: Detect the framework

Read \`package.json\` and match against this table:

| Dependency | Integration guide |
|------------|-------------------|
| \`next\` | https://uppy.io/docs/nextjs/ |
| \`react-router\` / \`@react-router/dev\` / \`@remix-run/react\` | https://uppy.io/docs/reactrouter/ |
| \`@sveltejs/kit\` | https://uppy.io/docs/sveltekit/ |
| \`react\` (no meta-framework) | https://uppy.io/docs/react/ |
| \`vue\` | https://uppy.io/docs/vue/ |
| \`svelte\` | https://uppy.io/docs/svelte/ |
| \`@angular/core\` | https://uppy.io/docs/angular/ |
| none (vanilla JS/HTML) | https://uppy.io/docs/quick-start/ |

Nuxt, Astro, and other meta-frameworks have no dedicated page — use the underlying framework's guide and mount Uppy client-side only.

## Step 2: Choose the uploader

This is the decision that shapes everything else. Ask the user if it isn't obvious from the codebase.

| Situation | Plugin | Docs |
|-----------|--------|------|
| Managed uploads + encoding/processing, no server to run | \`@uppy/transloadit\` | https://uppy.io/docs/transloadit/ |
| Resumable uploads to your own tus server | \`@uppy/tus\` | https://uppy.io/docs/tus/ |
| Direct to S3 or S3-compatible storage (R2, MinIO, Spaces) | \`@uppy/aws-s3\` | https://uppy.io/docs/aws-s3/ |
| Plain POST/PUT to an existing endpoint | \`@uppy/xhr-upload\` | https://uppy.io/docs/xhr-upload/ |

Full reasoning: https://uppy.io/docs/guides/choosing-uploader/

## Step 3: Install and wire up

\`\`\`bash
npm install @uppy/core @uppy/dashboard @uppy/react   # swap @uppy/react for @uppy/vue / @uppy/svelte / @uppy/angular
npm install @uppy/tus                                # + the uploader chosen in step 2
\`\`\`

Minimal React/Next.js shape:

\`\`\`tsx
'use client';
import { useState } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import Tus from '@uppy/tus';
import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

function createUppy() {
  return new Uppy().use(Tus, { endpoint: '/api/upload' });
}

export function Uploader() {
  const [uppy] = useState(createUppy);
  return <Dashboard uppy={uppy} />;
}
\`\`\`

Then implement the server side for whichever uploader was chosen (tus handler, S3 signing route, or plain upload endpoint). Follow the framework guide — it has the server code for that specific router.

For \`@uppy/aws-s3\`, pick exactly one signing mode:

- \`signRequest\` — your server returns a presigned URL per S3 operation; credentials never leave the server. The default choice.
- \`getCredentials\` — your server hands out temporary STS credentials and the browser signs (SigV4). Needs \`s3Endpoint\` (the bucket URL), and \`getCredentials\` must return the bucket's \`region\` along with the credentials.
- \`companionEndpoint\` — Companion signs. Only if you already run Companion.

## Step 4: Remote sources (only if asked for)

Google Drive, Dropbox, OneDrive, Box, Unsplash, and import-from-URL require Companion, a server-side component.

- Quick path: \`@uppy/remote-sources\` pointed at Transloadit's hosted Companion
- Self-hosted: https://uppy.io/docs/companion/ — Uppy 6 needs Companion 7 or newer
- Companion requires \`corsOrigins\` to be set explicitly — it will not start sensibly without it
- Companion 7 runs on Express 5 (mounting it in an Express 4 app fails), and \`companion.socket(server, companionOptions)\` takes the same options object as \`companion.app()\`

## Step 5: Custom UI (only if the Dashboard doesn't fit)

Uppy ships headless components and hooks. Prefer these over building from scratch:

\`\`\`tsx
import { UppyContextProvider, Dropzone, FilesList, UploadButton } from '@uppy/react';
\`\`\`

Or drop to hooks — \`useDropzone\`, \`useUppyState\`, \`useUppyEvent\` — and render your own markup. Equivalents exist for Vue and Svelte.

## Critical rules

- **CSS paths** (since v5): \`@uppy/core/css/style.min.css\`, not \`@uppy/core/dist/css/style.min.css\`
- **Component imports are subpaths**: \`import Dashboard from '@uppy/react/dashboard'\`, not \`import { Dashboard } from '@uppy/react'\`
- **Never construct Uppy in a render body.** React: \`const [uppy] = useState(createUppy)\`. Recreating the instance on every render is the single most common Uppy bug.
- **Uppy is client-only.** \`'use client'\` in Next.js App Router; no SSR of the Dashboard.
- \`new Uppy()\` — the export is not callable as a function
- **Merged into \`@uppy/core\` in v6**: \`@uppy/utils\`, \`@uppy/store-default\`, \`@uppy/companion-client\`, \`@uppy/provider-views\` — import from \`@uppy/core/utils\`, \`@uppy/core/companion-client\`, etc., and don't install the old packages
- **\`@uppy/aws-s3\` was rewritten in v6**: \`getUploadParameters\`, \`createMultipartUpload\`, \`signPart\`, \`listParts\`, \`completeMultipartUpload\`, \`abortMultipartUpload\`, \`getTemporarySecurityCredentials\`, and \`endpoint\` are gone. Use \`signRequest\`, \`getCredentials\`, or \`companionEndpoint\`. \`companionEndpoint\` is the Companion URL; \`s3Endpoint\` is the bucket URL — don't mix them up
- \`@uppy/instagram\` is removed in v6, and \`@uppy/remote-sources\` throws on unknown source keys
- **Removed/deprecated in v5**: \`@uppy/status-bar\` and \`@uppy/informer\` merged into \`@uppy/dashboard\` (move their options onto Dashboard); \`@uppy/progress-bar\`, \`@uppy/drag-drop\`, \`@uppy/file-input\` deprecated in favour of headless components and hooks
- \`@uppy/aws-s3-multipart\` no longer exists — use \`@uppy/aws-s3\` with \`shouldUseMultipart\`
- **Never put a Transloadit auth secret in client code.** Use \`assemblyOptions()\` as an async function that fetches a signature from your own server; it runs once per upload batch, not per file.
- To change plugin options after mount, use \`uppy.setOptions()\` / \`uppy.getPlugin('Webcam').setOptions()\` inside an effect — don't rebuild the instance
- The CDN bundle (\`releases.transloadit.com/uppy/...\`) contains nearly every plugin — fine for a prototype, not for production

Docs index: https://uppy.io/docs/quick-start/
Breaking changes: https://uppy.io/docs/guides/migration-guides/
Runnable examples: https://github.com/transloadit/uppy/tree/main/examples
`;
