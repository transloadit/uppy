# Releasing Uppy

Releases are driven by [changesets](https://github.com/changesets/changesets) and
published to npm using [staged publishing](https://docs.npmjs.com/staged-publishing/).

Staged publishing means CI never puts a package live on its own. It uploads the
tarball to npm in a *staged* state, invisible to everyone, and a maintainer then
approves it from their own machine with 2FA. Nothing ships without a human
being present, so a compromised CI job or a stolen token cannot release Uppy.

## 1. Land changesets

Every PR that changes a published package should include a changeset:

```bash
yarn changeset
```

## 2. Merge the release PR

The [release workflow](.github/workflows/release.yml) keeps a `[ci] release` pull
request up to date with the pending version bumps and changelogs. Merging it into
`main` is what starts a release.

## 3. CI stages the packages

On push to `main` with no changesets left, the workflow runs
[`scripts/stage-publish.mjs`](scripts/stage-publish.mjs) (`yarn release`), which:

- finds every non-private workspace package whose version is not on npm yet;
- packs each one **with Yarn**, so `workspace:^` ranges resolve to real semver
  ranges (the npm CLI does not do this when run per package directory);
- uploads the tarball with `npm stage publish`;
- creates the `<name>@<version>` git tag and prints `New tag: …`, which is what
  `changesets/action` uses to push tags and open GitHub releases.

Git tags, GitHub releases, the CDN upload and the Companion Docker image all
happen at this point, before approval. If you ever reject a staged package, clean
those up by hand.

At the end of the job the packages exist on npm but **cannot be installed yet**.

## 4. Approve the release

From a checkout of `main`, logged in to npm (`npm login`) with 2FA enabled:

```bash
yarn release:approve
```

It lists everything CI staged for this repo, asks for confirmation, and then
approves each package. One 2FA code is reused for as long as npm accepts it; you
are only asked for a new one when a code is refused.

Useful variants:

```bash
yarn release:approve --dry-run
```

```bash
yarn release:approve @uppy/core
```

To throw a staged version away instead of publishing it, find its id with
`npm stage list` and run `npm stage reject <stage-id>`.

## Requirements

- **npm 11.15.0 or newer** (`npm install --global npm@latest`) and **Node 22.14
  or newer**. Older npm has no `npm stage` command.
- The npm trust relationship (OIDC) used by CI must allow `npm stage publish`.
  On npmjs.com this is the `--allow-stage-publish` permission; you can leave
  `--allow-publish` disabled so CI is unable to publish directly at all.
- Approving is a 2FA action and can never be done by a token or in CI. It has to
  be a maintainer on their own machine.

## Escape hatches

A package that has **never** been published cannot be staged — npm requires the
name to already exist. `scripts/stage-publish.mjs` detects this, warns, and
publishes that one package directly; every other package still goes through
staging.

To bypass staging entirely for a release, set `UPPY_SKIP_STAGING=true`. This
publishes everything immediately, the way Uppy released before staged publishing.
