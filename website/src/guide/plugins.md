---
title: Plugins
type: guide
order: 17
---



## Writing a Plugin

Plugins usually add global-level functionality to Uppy. There is no strictly defined scope for a plugin - there are typically several types of plugins you can write:

1. Add some global methods or properties. e.g. [uppy-element](https://github.com/transloadit/uppy-element)

2. Add one or more global assets: directives/filters/transitions etc. e.g. [uppy-touch](https://github.com/transloadit/uppy-touch)

3. Add some Uppy instance methods by attaching them to Uppy.prototype.

4. A library that provides an API of its own, while at the same time injecting some combination of the above. e.g. [uppy-router](https://github.com/transloadit/uppy-router)

A Uppy plugin should expose an `install` method. The method will be called with the `Uppy` constructor as the first argument, along with possible options:

``` js
MyPlugin.install = function (Uppy, options) {
  // 1. add global method or property
  Uppy.myGlobalMethod = ...
  // 2. add a global asset
  Uppy.directive('my-directive', {})
  // 3. add an instance method
  Uppy.prototype.$myMethod = ...
}
```

## Using a Plugin

Use plugins by calling the `Uppy.use()` global method:

``` js
// calls `MyPlugin.install(Uppy)`
Uppy.use(MyPlugin)
```

You can optionally pass in some options:

``` js
Uppy.use(MyPlugin, { someOption: true })
```

Some plugins such as `uppy-router` automatically calls `Uppy.use()` if `Uppy` is available as a global variable. However in a module environment you always need to call `Uppy.use()` explicitly:

``` js
// When using CommonJS via Browserify or Webpack
var Uppy = require('uppy')
var VueRouter = require('uppy-router')

// Don't forget to call this
Uppy.use(VueRouter)
```

## Existing Plugins & Tools

- [uppy-router](https://github.com/transloadit/uppy-router): The official router for Uppy. Deeply integrated with Uppy core to make building Single Page Applications a breeze.

- [uppy-resource](https://github.com/transloadit/uppy-resource): A plugin that provides services for making web requests and handle responses using a XMLHttpRequest or JSONP.

- [uppy-async-data](https://github.com/transloadit/uppy-async-data): Async data loading plugin.

- [uppy-validator](https://github.com/transloadit/uppy-validator): A plugin for form validations.

- [uppy-devtools](https://github.com/transloadit/uppy-devtools): A Chrome devtools extension for debugging Uppy applications.

- [uppy-touch](https://github.com/transloadit/uppy-touch): Add touch-gesture directives using Hammer.js. (outdated)

- [uppy-element](https://github.com/transloadit/uppy-element): Register Custom Elements with Uppy.

- [List of User Contributed Tools](https://github.com/transloadit/uppy/wiki/User-Contributed-Components-&-Tools)
