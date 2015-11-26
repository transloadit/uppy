---
title: List Rendering
type: guide
order: 8
---

## v-for

We can use the `v-for` directive to render a list of items based on an Array. The `v-for` directive requires a special syntax in the form of `item in items`, where `items` is the source data Array and `item` is an **alias** for the Array element being iterated on:

**Example:**

``` html
<ul id="example-1">
  <li v-for="item in items">
    {{ item.message }}
  </li>
</ul>
```

``` js
var example1 = new Uppy({
  el: '#example-1',
  data: {
    items: [
      { message: 'Foo' },
      { message: 'Bar' }
    ]
  }
})
```

**Result:**

{% raw %}
<ul id="example-1" class="demo">
  <li v-for="item in items">
    {{item.message}}
  </li>
</ul>
<script>
var example1 = new Uppy({
  el: '#example-1',
  data: {
    items: [
      { message: 'Foo' },
      { message: 'Bar' }
    ]
  },
  watch: {
    items: function () {
      smoothScroll.animateScroll(null, '#example-1')
    }
  }
})
</script>
{% endraw %}

Inside `v-for` blocks we have full access to parent scope properties, plus a special variable `$index` which, as you probably have guessed, is the Array index for the current item:

``` html
<ul id="example-2">
  <li v-for="item in items">
    {{ parentMessage }} - {{ $index }} - {{ item.message }}
  </li>
</ul>
```

``` js
var example2 = new Uppy({
  el: '#example-2',
  data: {
    parentMessage: 'Parent',
    items: [
      { message: 'Foo' },
      { message: 'Bar' }
    ]
  }
})
```

**Result:**

{% raw%}
<ul id="example-2" class="demo">
  <li v-for="item in items">
    {{ parentMessage }} - {{ $index }} - {{ item.message }}
  </li>
</ul>
<script>
var example2 = new Uppy({
  el: '#example-2',
  data: {
    parentMessage: 'Parent',
    items: [
      { message: 'Foo' },
      { message: 'Bar' }
    ]
  },
  watch: {
    items: function () {
      smoothScroll.animateScroll(null, '#example-2')
    }
  }
})
</script>
{% endraw %}

Alternatively, you can also specify an alias for the index (or the key if `v-for` is used on an Object):

``` html
<div v-for="(index, item) in items">
  {{ index }} {{ item.message }}
</div>
```

## Template v-for

Similar to template `v-if`, you can also use a `<template>` tag with `v-for` to render a block of multiple elements. For example:

``` html
<ul>
  <template v-for="item in items">
    <li>{{ item.msg }}</li>
    <li class="divider"></li>
  </template>
</ul>
```

## Array Change Detection

### Mutation Methods

Uppy.js wraps an observed Array's mutation methods so they will also trigger View updates. The wrapped methods are:

- `push()`
- `pop()`
- `shift()`
- `unshift()`
- `splice()`
- `sort()`
- `reverse()`

You can open the console and play with the previous examples' `items` array by calling its mutation methods. For example: `example1.items.push({ message: 'Baz' })`.

### Replacing an Array

Mutation methods, as the name suggests, mutate the original Array they are called on. In comparison, there are also non-mutating methods, e.g. `filter()`, `concat()` and `slice()`, which do not mutate the original Array but **always return a new Array**. When working with non-mutating methods, you can just replace the old Array with the new one:

``` js
example1.items = example1.items.filter(function (item) {
  return item.message.match(/Foo/)
})
```

You might think this will cause Uppy.js to throw away the existing DOM and re-render the entire list - luckily that is not the case. Uppy.js implements some smart heuristics to maximize DOM element reuse, so replacing an array with another array containing overlapping objects is a very efficient operation.

### track-by

In some cases, you might need to replace the Array with completely new objects - e.g. ones created from an API call. Since by default `v-for` determines the reusability of existing scopes and DOM elements by tracking the identity of its data object, this could cause the entire list to be re-rendered. However, if each of your data objects has a unique id property, then you can use a `track-by` special attribute to give Uppy.js a hint so that it can reuse existing instances as much as possible.

For example, if your data looks like this:

``` js
{
  items: [
    { _uid: '88f869d', ... },
    { _uid: '7496c10', ... }
  ]
}
```

Then you can give the hint like this:

``` html
<div v-for="item in items" track-by="_uid">
  <!-- content -->
</div>
```

Later on, when you replace the `items` array and Uppy.js encounters a new object with `_uid: '88f869d'`, it knows it can reuse the existing scope and DOM elements associated with the same `_uid`.

### track-by $index

If you don't have a unique key to track by, you can also use `track-by="$index"`, which will force `v-for` into in-place update mode: fragments are no longer moved around, they simply get flushed with the new value at the corresponding index. This mode can also handle duplicate values in the source array.

This can make Array replacement extremely efficient, but it comes at a trade-off. Because DOM nodes are no longer moved to reflect the change in order, temporary state like DOM input values and component private state can become out of sync. So, be careful when using `track-by="$index"` if the `v-for` block contains form input elements or child components.

### Caveats

Due to limitations of JavaScript, Uppy.js **cannot** detect the following changes to an Array:

1. When you directly set an item with the index, e.g. `vm.items[0] = {}`;
2. When you modify the length of the Array, e.g. `vm.items.length = 0`.

To deal with caveat (1), Uppy.js augments observed Arrays with a `$set()` method:

``` js
// same as `example1.items[0] = ...` but triggers view update
example1.items.$set(0, { childMsg: 'Changed!'})
```

To deal with caveat (2), just replace `items` with an empty array instead.

In addition to `$set()`, Uppy.js also augments Arrays with a convenience method `$remove()`, which searches for and removes an item from target Array by calling `splice()` internally. So instead of:

``` js
var index = this.items.indexOf(item)
if (index !== -1) {
  this.items.splice(index, 1)
}
```

You can just do:

``` js
this.items.$remove(item)
```

## Object v-for

You can also use `v-for` to iterate through the properties of an Object. In addition to `$index`, each scope will have access to another special property `$key`.

``` html
<ul id="repeat-object" class="demo">
  <li v-for="value in object">
    {{ $key }} : {{ value }}
  </li>
</ul>
```

``` js
new Uppy({
  el: '#repeat-object',
  data: {
    object: {
      FirstName: 'John',
      LastName: 'Doe',
      Age: 30
    }
  }
})
```

**Result:**

{% raw %}
<ul id="repeat-object" class="demo">
  <li v-for="value in object">
    {{ $key }} : {{ value }}
  </li>
</ul>
<script>
new Uppy({
  el: '#repeat-object',
  data: {
    object: {
      FirstName: 'John',
      LastName: 'Doe',
      Age: 30
    }
  }
})
</script>
{% endraw %}

You can also provide an alias for the key:

``` html
<div v-for="(key, val) in object">
  {{ key }} {{ val }}
</div>
```

<p class="tip">When iterating over an Object, the order is based on the key enumeration order of `Object.keys()`, which is **not** guaranteed to be consistent in all JavaScript engine implementations.</p>

## Range v-for

`v-for` can also take an integer Number. In this case it will repeat the template that many times.

``` html
<div>
  <span v-for="n in 10">{{ n }} </span>
</div>
```

Result:

{% raw %}
<div id="range" class="demo">
  <span v-for="n in 10">{{ n }} </span>
</div>
<script>
new Uppy({ el: '#range' })
</script>
{% endraw %}

## Displaying Filtered/Sorted Results

Sometimes we only need to display a filtered or sorted version of the Array without actually mutating or resetting the original data. There are two options to achieve this:

1. Create a computed property that returns the filtered or sorted Array;
2. Use the built-in `filterBy` and `orderBy` filters.

A computed property would give you finer-grained control and more flexibility since it's full JavaScript; but the filters can be more convenient for common use cases. For detailed usage of the Array filters, check out their [documentation](/api/#filterBy).
