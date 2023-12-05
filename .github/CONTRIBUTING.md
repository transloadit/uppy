## Contributing to Uppy

Fork the repository into your own account first. See the [GitHub Help](https://help.github.com/articles/fork-a-repo/) article for instructions.

After you have successfully forked the repository, clone it locally.

```sh
git clone https://github.com/transloadit/uppy.git
cd uppy
```

We are using [Corepack][] to manage versions of [Yarn][].
Corepack comes pre-installed with Node.js >=16.x, or can be installed through `npm`:

```sh
corepack -v || npm i -g corepack
corepack enable
```

[Corepack]: https://nodejs.org/api/corepack.html

[Yarn]: https://yarnpkg.com/

## Development

First of all, install Uppy dependencies:

```bash
yarn install
```

### Basic

To run a basic development version of Uppy, run:

```bash
yarn dev
```

and go to http://localhost:5174 (or whatever link the yarn command outputted).
As you edit Uppy code, the browser will live reload the changes.

### Companion

If you’d like to work on features that the basic development version of Uppy doesn’t support, such as Uppy integrations with Instagram/Google Drive/Facebook etc., you need to set up your `.env` file (copy the contents of `.env.example` and adjust them based on what you need to work on), and run:

```bash
yarn run dev:with-companion
```

Or, if you only want to run the Companion server:

```bash
yarn run start:companion
```

This would get the Companion instance running on `http://localhost:3020`. It uses [nodemon](https://github.com/remy/nodemon) so it will automatically restart when files are changed.

### Live example

An example server is running at <https://companion.uppy.io>, which is deployed with [Kubernetes](https://github.com/transloadit/uppy/blob/main/packages/%40uppy/companion/KUBERNETES.md)

### How the Authentication and Token mechanism works

This section describes how Authentication works between Companion and Providers. While this behaviour is the same for all Providers (Dropbox, Instagram, Google Drive, etc.), we are going to be referring to Dropbox in place of any Provider throughout this section.

The following steps describe the actions that take place when a user Authenticates and Uploads from Dropbox through Companion:

* The visitor to a website with Uppy clicks `Connect to Dropbox`.
* Uppy sends a request to Companion, which in turn sends an OAuth request to Dropbox (Requires that OAuth credentials from Dropbox have been added to Companion).
* Dropbox asks the visitor to log in, and whether the Website should be allowed to access your files
* If the visitor agrees, Companion will receive a token from Dropbox, with which we can temporarily download files.
* Companion encrypts the token with a secret key and sends the encrypted token to Uppy (client)
* Every time the visitor clicks on a folder in Uppy, it asks Companion for the new list of files, with this question, the token (still encrypted by Companion) is sent along.
* Companion decrypts the token, requests the list of files from Dropbox and sends it to Uppy.
* When a file is selected for upload, Companion receives the token again according to this procedure, decrypts it again, and thereby downloads the file from Dropbox.
* As the bytes arrive, Companion uploads the bytes to the final destination (depending on the configuration: Apache, a Tus server, S3 bucket, etc).
* Companion reports progress to Uppy, as if it were a local upload.
* Completed!

### Instagram integration

Even though facebook [allows using](https://developers.facebook.com/blog/post/2018/06/08/enforce-https-facebook-login/) http://localhost in dev mode, Instagram doesn’t seem to support that, and seems to need a publically available domain name with HTTPS. So we will tunnel requests to localhost using `ngrok`.

Make sure that you are using a development facebook app at <https://developers.facebook.com/apps>

Go to “Instagram Basic Display” and find `Instagram App ID` and `Instagram App Secret`. Put them in a file called `.env` in the repo root:

    COMPANION_INSTAGRAM_KEY="Instagram App ID"
    COMPANION_INSTAGRAM_SECRET="Instagram App Secret"

**Note!** `ngrok` seems to be blocked by Instagram now, so you may have to find an alternative.

Run

```bash
ngrok http 3020
```

Note the ngrok https base URL, for example `https://e0c7de09808d.ngrok.io` and
append `/instagram/redirect` to it, such as:

    https://e0c7de09808d.ngrok.io/instagram/redirect

Add this full ngrok URL to `Valid OAuth Redirect URIs` under `Instagram Basic Display`.

Edit `.env` and change to your ngrok URI:

    COMPANION_DOMAIN="e0c7de09808d.ngrok.io"
    COMPANION_PROTOCOL="https"
    VITE_COMPANION_URL = 'https://e0c7de09808d.ngrok.io'

Go to: Roles -> Roles -> Add Instagram testers -> Add your instagram account

Go to your instagram account at <https://www.instagram.com/accounts/manage_access/>

Tester invites -> Accept

Now you should be able to test the Instagram integration.

### Requiring files

* If we are `require()`ing a file from the same subpackage, we can freely use relative imports as long as the required file is under the `src` directory (for example to import `@uppy/dashboard/src/utils/hi.js` from `@uppy/dashboard/src/index.js`, use `require('./utils/hi.js')`).
* But if we want to `require()` some file from another subpackage - we should use global @uppy requires, and they should always be in the form of `@uppy/:packageName/(lib instead of src)/(same path).js`

## Tests

### Unit tests

Unit tests are using Jest and can be run with:

```bash
yarn test:unit
```

### End-to-End tests

We use [Cypress](https://www.cypress.io/) for our e2e test suite. Be sure to checkout “[Writing your first test](https://docs.cypress.io/guides/getting-started/writing-your-first-test#Add-a-test-file)” and the “[Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Cypress-Can-Be-Simple-Sometimes)”. You should also be aware of the “[Best Practices](https://docs.cypress.io/guides/references/best-practices)”.

To get started make sure you have your `.env` set up. Copy the contents of `.env.example` to a file named `.env` and add the values relevant for the test(s) you are trying to run.

To start the testing suite run:

    yarn e2e

This will run Cypress in watch-mode, and it will pick up and rebuild any changes to JS files. If you need to change other files (like CSS for example), you need to run the respective `yarn build:*` scripts.

Alternatively the following command is the same as the above, except it doesn’t run `build` first:

    yarn e2e:skip-build

To generate the boilerplate for a new test run:

    yarn e2e:generate

## Zoom

See above Instagram instructions for setting up a tunnel, but replace `instagram` with `zoom` in the URL. Note that **you also have to add the OAuth redirect URL to `OAuth allow list`** in the Zoom Oauth app settings or it will not work.

Add the following scopes: `recording:read`, `user:read`, `user_info:read`

To test recording a meeting, you need to sign up for a Zoom Pro trial (can be cancelled later), for example using their iOS app.

## Releases

Releases are managed by GitHub Actions, here’s an overview of the process to release a new Uppy version:

* Run `yarn release` on your local machine.
* Follow the instructions and select what packages to release. **Warning:** skipping packages results in those changes being “lost”, meaning they won’t be picked up in the changelog automatically next release. Always try to release all.
* Before committing, check if the generated files look good.
* When asked to edit the next CHANGELOG, only include changes related to the package(s) you selected for release.
* Push to the Transloadit repository using the command given by the tool. Do not open a PR yourself, the GitHub Actions will create one and assign you to it.
* Wait for all the GitHub Actions checks to pass. If one fails, try to figure out why. Do not go ahead without consulting the rest of the team.
* Review the PR thoroughly, and if everything looks good to you, approve the PR. Do not merge it manually!
* After the PR is automatically merged, the demos on transloadit.com should also be updated. Check that some things work locally:
  * the demos in the demo section work (try one that uses an import robot, and one that you need to upload to)
  * the demos on the homepage work and can import from Google Drive, Instagram, Dropbox, etc.

If you don’t have access to the transloadit.com source code ping @arturi or @goto-bus-stop and we’ll pick it up. :sparkles:

### Releasing hotfix patch

#### Companion hotfix

First checkout the tag of the version you want to patch:

```bash
git checkout @uppy/companion@x.y.z
```

Now create a branch for your hotfix:

```bash
git checkout -b x.y.z-hotfix
```

Run yarn to make sure all packages are consistent:

```bash
corepack yarn
```

Now navigate to the Companion workspace:

```bash
cd packages/@uppy/companion
```

**Now cherry pick your desired commits**.

Next edit `CHANGELOG.md` and then commit it:

```bash
git add CHANGELOG.md
git commit -m 'Update changelog'
```

Now let’s create the version & tag:

```bash
mkdir -p .git && npm version --workspaces-update=false --tag-version-prefix='@uppy/companion@' patch
```

Run a “dry-run” first:

```bash
corepack yarn pack
```

If the earlier command succeeded, let’s publish!

```bash
corepack yarn npm publish --access public --tag=none
```

Now we can push our branch and tags.

```bash
git push && git push --tags
```

#### Hotfix other packages

For other Uppy packages, the process should be like Companion,
but hasn’t been documented yet. Make sure to remember to run `yarn` as well as building the package first, then you can release it.
If you do release any other packages, please update this doc.

## CSS guidelines

The CSS standards followed in this project closely resemble those from [Medium’s CSS Guidelines](https://gist.github.com/fat/a47b882eb5f84293c4ed). If something is not mentioned here, follow their guidelines.

### Naming conventions

This project uses naming conventions adopted from the SUIT CSS framework.
[Read about them here](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md).

To quickly summarize:

#### Utilities

Syntax: `u-[sm-|md-|lg-]<utilityName>`

```css
.u-utilityName
.u-floatLeft
.u-lg-col6
```

#### Components

Syntax: `[<namespace>-]<ComponentName>[-descendentName][--modifierName]`

```css
.twt-Button /* Namespaced component */
.MyComponent /* Components pascal cased */
.Button--default /* Modified button style */
.Button--large

.Tweet
.Tweet-header /* Descendents */
.Tweet-bodyText

.Accordion.is-collapsed /* State of component */
.Accordion.is-expanded
```

### SASS

This project uses SASS, with some limitations on nesting. One-level-deep nesting is allowed, but nesting may not extend a selector by using the `&` operator. For example:

```sass
/* BAD */
.Button {
  &--disabled {
    ...
  }
}

/* GOOD */
.Button {
  ...
}

.Button--disabled {
  ...
}
```

### Mobile-first responsive approach

Style to the mobile breakpoint with your selectors, then use `min-width` media queries to add any styles to the tablet or desktop breakpoints.

### Selector, rule ordering

* All selectors are sorted alphabetically and by type.
* HTML elements go above classes and IDs in a file.
* Rules are sorted alphabetically.

```scss
/* BAD */
.wrapper {
  width: 940px;
  margin: auto;
}

h1 {
  color: red;
}

.article {
  width: 100%;
  padding: 32px;
}

/* GOOD */
h1 {
  color: red;
}

.article {
  padding: 32px;
  width: 100%;
}

.wrapper {
  margin: auto;
  width: 940px;
}
```

## Adding a new integration

Before opening a pull request for the new integration, open an issue to discuss said integration with the Uppy team. After discussing the integration, you can get started on it. First off, you need to construct the basic components for your integration. The following components are the current standard:

* `Dashboard`: Inline Dashboard (`inline: true`)
* `DashboardModal`: Dashboard as a modal
* `DragDrop`
* `ProgressBar`
* `StatusBar`

All these components should function as references to the normal component. Depending on how the framework you’re using handles references to the DOM, your approach to creating these may be different. For example, in React, you can assign a property of the component to the reference of a component ([see here](https://github.com/transloadit/uppy/blob/425f9ecfbc8bc48ce6b734e4fc14fa60d25daa97/packages/%40uppy/react/src/Dashboard.js#L47-L54)). This may differ in your framework, but from what we’ve found, the concepts are generally pretty similar.

If you’re familiar with React, Vue or soon Svelte, it might be useful to read through the code of those integrations, as they lay out a pretty good structure. After the basic components have been built, here are a few more important tasks to get done:

* Add TypeScript support in some capacity (if possible)
* Write documentation
* Add an example
* Configuring the build system

### Common issues

Before going into these tasks, here are a few common gotchas that you should be aware of.

#### Dependencies

Your `package.json` should resemble something like this:

```json
{
  "name": "@uppy/framework",
  "dependencies": {
    "@uppy/dashboard": "workspace:^",
    "@uppy/drag-drop": "workspace:^",
    "@uppy/progress-bar": "workspace:^",
    "@uppy/status-bar": "workspace:^",
    "@uppy/utils": "workspace:^",
    "prop-types": "^15.6.1"
  },
  "peerDependencies": {
    "@uppy/core": "workspace:^"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

The most important part about this is that `@uppy/core` is a peer dependency. If your framework complains about `@uppy/core` not being resolved, you can also add it as a dev dependency

### Adding TypeScript Support

This section won’t be too in-depth, because TypeScript depends on your framework. As general advice, prefer using `d.ts` files and vanilla JavaScript over TypeScript files. This is circumstantial, but it makes handling the build system a lot easier when TypeScript doesn’t have to transpiled. The version of typescript in the monorepo is `4.1`.

### Writing docs

Generally, documentation for integrations can be broken down into a few pieces that apply to every component, and then documentation for each component. The structure should look something like this:

* Installation
* Initializing Uppy (may vary depending on how the framework handles reactivity)
* Usage
* _For each component_
  * Loading CSS
  * Props

It may be easier to copy the documentation of earlier integrations and change the parts that need to be changed rather than writing this from scratch. Preferably, keep the documentation to one page. For the front-matter, write something like:

```markdown
title: Framework Name
type: docs
module: "@uppy/framework"
order: 0
category: "Other Integrations"
```

This data is used to generate Uppy’s website.

Any change of the documentation that involves a security best practice must substantiated with an external reference. See [#3565](https://github.com/transloadit/uppy/issues/3565).

### Adding an example

You can likely use whatever code generation tool for your framework (ex. `create-react-app`) to create this example. Make sure you add the same version of `@uppy/core` to this as your peer dependency required, or you may run into strange issues. Try to include all the components are some of their functionality. [The React example](https://github.com/transloadit/uppy/blob/main/examples/react-example/App.js) is a great... well example of how to do this well.

### Integrating the build system

The biggest part of this is understanding Uppy’s build system. The high level description is that `babel` goes through almost all the packages and transpiles all the Javascript files in the `src` directory to more compatible JavaScript in the `lib` folder. If you’re using vanilla JavaScript for your integration (like React and Vue do), then you can use this build system and use the files generated as your entry points.

If you’re using some kind of more abstract file format (like Svelte), then you probably want do to a few things: add the directory name to [this `IGNORE` regex](https://github.com/transloadit/uppy/blob/425f9ecfbc8bc48ce6b734e4fc14fa60d25daa97/bin/build-lib.js#L15); add all your build dependencies to the root `package.json` (try to keep this small); add a new `build:framework` script to the root `package.json`. This script usually looks something like this:

```json
{
  "scripts": {
    "build:framework": "cd framework && yarn run build"
  }
}
```

Then, add this script to the `build:js` script. Try running the `build:js` script and make sure it does not error. It may also be of use to make sure that global dependencies aren’t being used (ex. not having rollup locally and relying on a global install), as these dependencies won’t be present on the machine’s handling building.

## I18n and locales

For more information about how to contribute to translations, see [the `@uppy/locales` contributing guide](https://uppy.io/docs/locales/#contributing-a-new-language).
