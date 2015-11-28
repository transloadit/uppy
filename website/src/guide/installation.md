---
title: Installation
type: guide
order: 0
uppy_version: 0.0.1
dev_size: "240.69"
min_size: "68.54"
gz_size: "23.46"
---

> **Compatibility Note:** Uppy.js does not support IE8 and below.

## Standalone

Simply download and include with a script tag. `Uppy` will be registered as a global variable. **Pro tip: don't use the minified version during development. you will miss out all the nice warnings for common mistakes.**

<div id="downloads">
<a class="button" href="/js/Uppy.js" download>Development Version</a><span class="light info">With full warnings and debug mode</span>

<a class="button" href="/js/uppy.min.js" download>Production Version</a><span class="light info">Warnings stripped, {{gz_size}}kb min+gzip</span>
</div>

### CDN

Available on [assets.transloadt.com](//assets.transloadt.com/uppy/{{uppy_version}}/uppy.min.js) or [cdnjs](//cdnjs.cloudflare.com/ajax/libs/uppy/{{uppy_version}}/uppy.min.js) (takes some time to sync so the latest version might not be available yet).

### CSP-compliant build

Some environments, such as Google Chrome Apps, enforces Content Security Policy (CSP) and does not allow the use of `new Function()` for evaluating expressions. In these cases you can use the [CSP-compliant build](https://github.com/transloadit/uppy/tree/csp/dist) instead.

## NPM

NPM is the recommended installation method when building large scale apps with Uppy.js. It pairs nicely with a CommonJS module bundler such as [Webpack](http://webpack.github.io/) or [Browserify](http://browserify.org/). Uppy.js also provides accompanying tools for authoring [Single File Components](application.html#Single_File_Components).

``` bash
# latest stable
$ npm install uppy
# latest stable + CSP-compliant
$ npm install uppy@csp
# dev build (directly from GitHub):
$ npm install transloadit/uppy#dev
```

## Bower

``` bash
# latest stable
$ bower install uppy
```

## AMD Module Loaders

The standalone downloads or versions installed via Bower are wrapped with UMD so they can be used directly as an AMD module.
