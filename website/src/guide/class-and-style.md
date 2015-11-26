---
title: Class and Style Bindings
type: guide
order: 6
---

A common need for data binding is manipulating an element's class list and its inline styles. Since they are both attributes, we can use `v-bind` to handle them: we just need to calculate a final string with our expressions. However, meddling with string concatenation is annoying and error-prone. For this reason, Uppy.js provides special enhancements when `v-bind` is used for `class` and `style`. In addition to Strings, the expressions can also evaluate to Objects or Arrays.

## Binding HTML Classes

<p class="tip">Although you can use mustache interpolations such as `{% raw %}class="{{ className }}"{% endraw %}` to bind the class, it is not recommended to mix that style with `v-bind:class`. Use one or the other!</p>

### Object Syntax

We can pass an Object to `v-bind:class` to dynamically toggle classes. Note the `v-bind:class` directive can co-exist with the plain `class` attribute:

``` html
<div class="static" v-bind:class="{ 'class-a': isA, 'class-b': isB }"></div>
```
``` js
data: {
  isA: true,
  isB: false
}
```

Which will render:

``` html
<div class="static class-a"></div>
```

When `isA` and `isB` changes, the class list will be updated accordingly. For example, if `isB` becomes `true`, the class list will become `"class-a class-b"`.

And you can directly bind to an object in data as well:

``` html
<div v-bind:class="classObject"></div>
```
``` js
data: {
  classObject: {
    'class-a': true,
    'class-b': false
  }
}
```

This will render the same result. As you may have noticed, we can also bind to a [computed property](computed.html) that returns an Object. This is a common and powerful pattern.

### Array Syntax

We can pass an Array to `v-bind:class` to apply a list of classes:

``` html
<div v-bind:class="[classA, classB]">
```
``` js
data: {
  classA: 'class-a',
  classB: 'class-b'
}
```

Which will render:

``` html
<div class="class-a class-b"></div>
```

If you would like to also toggle a class in the list conditionally, you can do it with a ternary expression:

``` html
<div v-bind:class="[classA, isB ? classB : '']">
```

This will always apply `classA`, but will only apply `classB` when `isB` is `true`.

## Binding Inline Styles

### Object Syntax

The Object syntax for `v-bind:style` is pretty straightforward - it looks almost like CSS, except it's a JavaScript object. You can use either camelCase or kebab-case for the CSS property names:

``` html
<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```
``` js
data: {
  activeColor: 'red',
  fontSize: 30
}
```

It is often a good idea to bind to a style object directly so that the template is cleaner:

``` html
<div v-bind:style="styleObject"></div>
```
``` js
data: {
  styleObject: {
    color: 'red',
    fontSize: '13px'
  }
}
```

Again, the Object syntax is often used in conjunction with computed properties that return Objects.

### Array Syntax

The Array syntax for `v-bind:style` allows you to apply multiple style objects to the same element:

``` html
<div v-bind:style="[styleObjectA, styleObjectB]">
```

### Auto-prefixing

When you use a CSS property that requires vendor prefixes in `v-bind:style`, for example `transform`, Uppy.js will automatically detect and add appropriate prefixes to the applied styles.
