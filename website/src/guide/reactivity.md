---
title: Reactivity in Depth
type: guide
order: 13
---

We've covered most of the basics - now it's time to take a deep dive! One of Uppy.js' most distinct features is the unobtrusive reactive system - models are just plain JavaScript objects, modify it and the view updates. It makes state management very simple and intuitive, but it's also important to understand how it works to avoid some common gotchas. In this section, we are going to dig into some of the lower-level details of Uppy.js' reactivity system.

## How Changes Are Tracked

When you pass a plain JavaScript object to a Uppy instance as its `data` option, Uppy.js will walk through all of its properties and convert them to getter/setters using [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty). This is an ES5-only and un-shimmable feature, which is why Uppy.js doesn't support IE8 and below.

The getter/setters are invisible to the user, but under the hood they enable Uppy.js to perform dependency-tracking and change-notification when properties are accessed or modified. One caveat is that browser consoles format getter/setters differently when converted data objects are logged, so make sure to use the `vm.$log()` instance method for more inspection-friendly output.

For every directive / data binding in the template, there will be a corresponding **watcher** object, which records any properties "touched" during its evaluation as dependencies. Later on when a dependency's setter is called, it triggers the watcher to re-evaluate, and in turn causes its associated directive to perform DOM updates.

![data](/images/data.png)

## Change Detection Caveats

Due to the limitation of ES5, Uppy.js **cannot detect property addition or deletion**. Since Uppy.js performs the getter/setter conversion process during instance initialization, a property must be present in the `data` object in order for Uppy.js to convert it and make it reactive. For example:

``` js
var data = { a: 1 }
var vm = new Uppy({
  data: data
})
// `vm.a` and `data.a` are now reactive

vm.b = 2
// `vm.b` is NOT reactive

data.b = 2
// `data.b` is NOT reactive
```

However, there are ways to **add a property and make it reactive** after an instance has been created.

For Uppy instances, you can use the `$set(path, value)` instance method:

``` js
vm.$set('b', 2)
// `vm.b` and `data.b` are now reactive
```

For plain data objects, you can use the global `Uppy.set(object, key, value)` method:

``` js
Uppy.set(data, 'c', 3)
// `vm.c` and `data.c` are now reactive
```

There are also a few Array-related caveats, which were [discussed earlier in the list rendering section](/guide/list.html#Caveats).

## Initialize Your Data

Although Uppy.js provides the API to dynamically add reactive properties on the fly, it is recommended to declare all reactive properties upfront in the `data` option.

Instead of this:

``` js
var vm = new Uppy({
  template: '<div>{{msg}}</div>'
})
// add `msg` later
vm.$set('msg', 'Hello!')
```

Prefer this:

``` js
var vm = new Uppy({
  data: {
    // declare msg with an empty value
    msg: ''
  },
  template: '<div>{{msg}}</div>'
})
// set `msg` later
vm.msg = 'Hello!'
```

There are two reasons behind this pattern:

1. The `data` object is like the schema for your component's state. Declaring all reactive properties upfront makes the component code easier to understand and reason about.

2. Adding a top level reactive property on a Uppy instance will force all the watchers in its scope to re-evaluate, because it didn't exist before and no watcher could have tracked it as a dependency. The performance is usually acceptable (essentially the same as Angular's dirty checking), but can be avoided when you initialize the data properly.

## Async Update Queue

By default, Uppy.js performs DOM updates **asynchronously**. Whenever a data change is observed, Uppy will open a queue and buffer all the data changes that happens in the same event loop. If the same watcher is triggered multiple times, it will be pushed into the queue only once. Then, in the next event loop "tick", Uppy flushes the queue and performs only the necessary DOM updates. Internally Uppy uses `MutationObserver` if available for the asynchronous queuing and falls back to `setTimeout(fn, 0)`.

For example, when you set `vm.someData = 'new value'`, the DOM will not update immediately. It will update in the next "tick", when the queue is flushed. Most of the time we don't need to care about this, but it can be tricky when you want to do something that depends on the post-update DOM state. Although Uppy.js generally encourages developers to think in a "data-driven" fashion and avoid touching the DOM directly, sometimes it might be necessary to get your hands dirty. In order to wait until Uppy.js has finished updating the DOM after a data change, you can use `Uppy.nextTick(callback)` immediately after the data is changed. The callback will be called after the DOM has been updated. For example:

``` html
<div id="example">{{msg}}</div>
```

``` js
var vm = new Uppy({
  el: '#example',
  data: {
    msg: '123'
  }
})
vm.msg = 'new message' // change data
vm.$el.textContent === 'new message' // false
Uppy.nextTick(function () {
  vm.$el.textContent === 'new message' // true
})
```

There is also the `vm.$nextTick()` instance method, which is especially handy inside components, because it doesn't need global `Uppy` and its callback's `this` context will be automatically bound to the current Uppy instance:

``` js
Uppy.component('example', {
  template: '<span>{{msg}}</span>',
  data: function () {
    return {
      msg: 'not updated'
    }
  },
  methods: {
    updateMessage: function () {
      this.msg = 'updated'
      console.log(this.$el.textContent) // => 'not updated'
      this.$nextTick(function () {
        console.log(this.$el.textContent) // => 'updated'
      })
    }
  }
})
```

## Inside Computed Properties

It should be noted that Uppy.js computed properties are **not** simple getters. Each computed property keeps track of its own reactive dependencies. When a computed property is evaluated, Uppy.js updates its dependency list and caches the result value. The cached value is only invalidated when one of the tracked dependencies have changed. Therefore, as long as the dependencies did not change, accessing the computed property will directly return the cached value instead of calling the getter.

Why do we need caching? Imagine we have an expensive computed property **A**, which requires looping through a huge Array and doing a lot of computations. Then, we may have other computed properties that in turn depend on **A**. Without caching, we would be calling **A**’s getter many more times than necessary!

Because of computed property caching, the getter function is not always called when you access a computed property. Consider the following example:

``` js
var vm = new Uppy({
  data: {
    msg: 'hi'
  },
  computed: {
    example: function () {
      return Date.now() + this.msg
    }
  }
})
```

The computed property `example` has only one dependency: `vm.msg`. `Date.now()` is **not** a reactive dependency, because it has nothing to do with Uppy's data observation system. Therefore, when you programmatically access `vm.example`, you will find the timestamp to remain the same unless `vm.msg` triggers a re-evaluation.

In some use cases you may want to preserve the simple getter-like behavior, where every time you access `vm.example` it simply calls the getter again. You can do that by turning off caching for a specific computed property:

``` js
computed: {
  example: {
    cache: false,
    get: function () {
      return Date.now() + this.msg
    }
  }
}
```

Now, every time you access `vm.example`, the timestamp will be up-to-date. **However, note this only affects programmatic access inside JavaScript; data-bindings are still dependency-driven.** When you bind to a computed property in the template as `{% raw %}{{example}}{% endraw %}`, the DOM will only be updated when a reactive dependency has changed.
