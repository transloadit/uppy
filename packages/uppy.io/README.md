# Uppy.io

Website and documentation for [uppy.io](https://uppy.io).

Code for [uppy.io/blog](https://uppy.io/blog) lives in this repo.  
Code for [uppy.io/docs](https://uppy.io/docs/quick-start) lives in
[github.com/transloadit/uppy](https://github.com/transloadit/uppy).

## Developer guide

If you want to edit [uppy.io/blog](https://uppy.io/blog), just edit the files in
this repo.

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

---

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern
static website generator.
