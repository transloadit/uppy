---
title: Conditional Rendering
type: guide
order: 7
---

## v-if

In string templates, for example Handlebars, we would write a conditional block like this:

``` html
<!-- Handlebars template -->
{{#if ok}}
  <h1>Yes</h1>
{{/if}}
```

In Uppy.js, we use the `v-if` directive to achieve the same:

``` html
<h1 v-if="ok">Yes</h1>
```

It is also possible to add an "else" block with `v-else`:

``` html
<h1 v-if="ok">Yes</h1>
<h1 v-else>No</h1>
```

## Template v-if

Because `v-if` is a directive, it has to be attached to a single element. But what if we want to toggle more than one element? In this case we can use `v-if` on a `<template>` element, which serves as an invisible wrapper. The final rendered result will not include the `<template>` element.

``` html
<template v-if="ok">
  <h1>Title</h1>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</template>
```

## v-show

Another option for conditionally displaying an element is the `v-show` directive. The usage is largely the same:

``` html
<h1 v-show="ok">Hello!</h1>
```

The difference is that an element with `v-show` will always be rendered and remain in the DOM; `v-show` simply toggles the `display` CSS property of the element.

Note that `v-show` doesn't support the `<template>` syntax.

## v-else

You can use the `v-else` directive to indicate an "else block" for `v-if` or `v-show`:

``` html
<div v-if="Math.random() > 0.5">
  Sorry
</div>
<div v-else>
  Not sorry
</div>
```

The `v-else` element must following immediately after the `v-if` or `v-show` element - otherwise it will not be recognized.

## v-if vs. v-show

When a `v-if` block is toggled, Uppy.js will have to perform a partial compilation/teardown process, because the template content inside `v-if` can also contain data bindings or child components. `v-if` is "real" conditional rendering because it ensures that event listeners and child components inside the conditional block are properly destroyed and re-created during toggles.

`v-if` is also **lazy**: if the condition is false on initial render, it will not do anything - partial compilation won't start until the condition becomes true for the first time (and the compilation is subsequently cached).

In comparison, `v-show` is much simpler - the element is always compiled and preserved, with just simple CSS-based toggling.

Generally speaking, `v-if` has higher toggle costs while `v-show` has higher initial render costs. So prefer `v-show` if you need to toggle something very often, and prefer `v-if` if the condition is unlikely to change at runtime.
