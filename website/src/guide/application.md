---
title: Building Large-Scale Apps
type: guide
order: 18
---

The Uppy.js core library is designed to be focused and flexible - it's just a view layer library that doesn't enforce any application-level architecture. While this can be great for integrating with existing projects, it could be a challenge for those with less experience to build larger scale applications from scratch.

The Uppy.js ecosystem provides a set of tools, libraries on how to build large SPAs with Uppy. This part is where we start get a bit "framework"-ish, but it's really just an opinionated list of recommendations; you still get to pick what to use for each part of the stack.

## Modularization

For large projects it's necessary to utilize a modularized build system to better organize your code. The recommended approach of doing so is by writing your source code in CommonJS or ES6 modules and bundle them using [Webpack](http://webpack.github.io/) or [Browserify](http://browserify.org/).

Webpack and Browserify are more than just module bundlers, though. They both provide source transform APIs that allow you to transform your source code with other pre-processors. For example, you can write your code with future ES2015/2016 syntax using [babel-loader](https://github.com/babel/babel-loader) or [babelify](https://github.com/babel/babelify).

If you've never used them before, I highly recommend going through a few tutorials to get familiar with the concept of module bundlers, and start writing JavaScript using the latest ECMAScript features.

## Single File Components

In a typical Uppy.js project we will be dividing our interface into many small components, and it would be nice to have each component encapsulate its CSS styles, template and JavaScript definition in the same place. As mentioned above, when using Webpack or Browserify, with proper source transforms we can write our components like this:

<img src="/images/uppy-component.png">

If you are into pre-processors, you can even do this:

<img src="/images/uppy-component-with-pre-processors.png">

You can build these single-file Uppy components with Webpack + [uppy-loader](https://github.com/transloadit/uppy-loader) or Browserify + [vueify](https://github.com/transloadit/vueify). It is recommended to use the Webpack setup because Webpack's loader API enables better file dependency tracking / caching and some advanced features that are not feasible with Browserify transforms.

You can find examples of the build setups on GitHub:

- [Webpack + uppy-loader](https://github.com/transloadit/uppy-loader-example)
- [Browserify + vueify](https://github.com/transloadit/vueify-example)

## Routing

For Single Page Applications, it is recommended to use the [official uppy-router library](https://github.com/transloadit/uppy-router), which is currently in technical preview. For more details, please refer to uppy-router's [documentation](http://transloadit.github.io/uppy-router/).

If you just need some very simple routing logic, you can also implement it by manually listening on `hashchange` and utilizing a dynamic component:

**Example:**

``` html
<div id="app">
  <component :is="currentView"></component>
</div>
```

``` js
Uppy.component('home', { /* ... */ })
Uppy.component('page1', { /* ... */ })
var app = new Uppy({
  el: '#app',
  data: {
    currentView: 'home'
  }
})
// Switching pages in your route handler:
app.currentView = 'page1'
```

With this mechanism it's also very easy to leverage external routing libraries such as [Page.js](https://github.com/visionmedia/page.js) or [Director](https://github.com/flatiron/director).

## Communication with Server

All Uppy instances can have their raw `$data` directly serialized with `JSON.stringify()` with no additional effort. The community has contributed the [uppy-resource](https://github.com/transloadit/uppy-resource) plugin, which provides an easy way to work with RESTful APIs. You can also use any Ajax library you like, e.g. `$.ajax` or [SuperAgent](https://github.com/visionmedia/superagent). Uppy.js also plays nicely with no-backend services such as Firebase and Parse.

## State Management

In large applications, state management often becomes complex due to multiple pieces of state scattered across many components and the interactions between them. It is often overlooked that the source of truth in Uppy.js applications is the raw data object - a Uppy instances simply proxies access to it. Therefore, if you have a piece of state that should be shared by multiple instances, you should avoid duplicating it and share it by identity:

``` js
var sourceOfTruth = {}

var vmA = new Uppy({
  data: sourceOfTruth
})

var vmB = new Uppy({
  data: sourceOfTruth
})
```

Now whenever `sourceOfTruth` is mutated, both `vmA` and `vmB` will update their views automatically. Extending this idea further, we would arrive at the **store pattern**:

``` js
var store = {
  state: {
    message: 'Hello!'
  },
  actionA: function () {
    this.state.message = 'action A triggered'
  },
  actionB: function () {
    this.state.message = 'action B triggered'
  }
}

var vmA = new Uppy({
  data: {
    privateState: {},
    sharedState: store.state
  }
})

var vmB = new Uppy({
  data: {
    privateState: {},
    sharedState: store.state
  }
})
```

Notice we are putting all actions that mutate the store's state inside the store itself. This type of centralized state management makes it easier to understand what type of mutations could happen to the state, and how are they triggered. Each component can still own and manage its private state.

![State Management](/images/state.png)

One thing to take note is that you should never replace the original state object in your actions - the components and the store need to share reference to the same object in order for the mutations to be observed.

If we enforce a convention where components are never allowed to directly mutate state that belongs to a store, but should instead dispatch events that notify the store to perform actions, we've essentially arrived at the [Flux](https://facebook.github.io/flux/) architecture. The benefits of this convention is we can record all state mutations happening to the store, and on top of that we can implement advanced debugging helpers such as mutation logs, snapshots, history re-rolls etc.

The Flux architecture is commonly used in React applications. Turns out the core idea behind Flux can be quite simply achieved in Uppy.js, thanks to the unobtrusive reactivity system. Do note what we demonstrated here is just an example to introduce the concept - you may not need it at all for simple scenarios, and you should adapt the pattern to fit the real needs of your application.

## Unit Testing

Anything compatible with a module-based build system works. A recommendation is using the [Karma](http://karma-runner.github.io/0.12/index.html) test runner. It has a lot of community plugins, including support for [Webpack](https://github.com/webpack/karma-webpack) and [Browserify](https://github.com/Nikku/karma-browserify). For detailed setup, please refer to each project's respective documentation.

In terms of code structure for testing, the best practice is to export raw options / functions in your component modules. Consider this example:

``` js
// my-component.js
module.exports = {
  template: '<span>{{msg}}</span>',
  data: function () {
    return {
      msg: 'hello!'
    }
  }
  created: function () {
    console.log('my-component created!')
  }
}
```

You can use that file in your entry module like this:

``` js
// main.js
var Uppy = require('uppy')
var app = new Uppy({
  el: '#app',
  data: { /* ... */ },
  components: {
    'my-component': require('./my-component')
  }
})
```

And you can test that module like this:

``` js
// Some Jasmine 2.0 tests
describe('my-component', function () {
  // require source module
  var myComponent = require('../src/my-component')
  it('should have a created hook', function () {
    expect(typeof myComponent.created).toBe('function')
  })
  it('should set correct default data', function () {
    expect(typeof myComponent.data).toBe('function')
    var defaultData = myComponent.data()
    expect(defaultData.msg).toBe('hello!')
  })
})
```

<p class="tip">Since Uppy.js directives perform updates asynchronously, when you are asserting DOM state after changing the data, you will have to do so in a `Uppy.nextTick` callback.</p>

## Deploying for Production

The minified standalone build of Uppy.js has already stripped out all the warnings for you for a smaller file size, but when you are using tools like Browserify or Webpack to build Uppy.js applications, you will need some additional configuration to achieve this.

### Webpack

Use Webpack's [DefinePlugin](http://webpack.github.io/docs/list-of-plugins.html#defineplugin) to indicate a production environment, so that warning blocks can be automatically dropped by UglifyJS during minification. Example config:

``` js
var webpack = require('webpack')

module.exports = {
  // ...
  plugins: [
    // ...
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
}
```

### Browserify

Just run your bundling command with `NODE_ENV` set to `"production"`. Uppy automatically applies [envify](https://github.com/hughsk/envify) transform to itself and makes warning blocks unreachable. For example:

``` bash
NODE_ENV=production browserify -e main.js | uglifyjs -c -m > build.js
```

## An App Example

The [Uppy.js Hackernews Clone](https://github.com/transloadit/uppy-hackernews) is an example application that uses Webpack + uppy-loader for code organization, uppy-router for routing, and HackerNews' official Firebase API as the backend. It's by no means a big application, but it demonstrates the combined usage of the concepts discussed on this page.
