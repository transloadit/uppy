---
title: Methods and Event Handling
type: guide
order: 9
---

## Method Handler

We can then use the `v-on` directive to listen to DOM events:

``` html
<div id="example">
  <button v-on:click="greet">Greet</button>
</div>
```

We are binding a click event listener to a method named `greet`. Here's how to define that method in our Uppy instance:

``` js
var vm = new Uppy({
  el: '#example',
  data: {
    name: 'Uppy.js'
  },
  // define methods under the `methods` object
  methods: {
    greet: function (event) {
      // `this` inside methods point to the Uppy instance
      alert('Hello ' + this.name + '!')
      // `event` is the native DOM event
      alert(event.target.tagName)
    }
  }
})

// you can invoke methods in JavaScript too
vm.greet() // -> 'Hello Uppy.js!'
```

Test it yourself:

{% raw %}
<div id="example" class="demo">
  <button v-on:click="greet">Greet</button>
</div>
<script>
var vm = new Uppy({
  el: '#example',
  data: {
    name: 'Uppy.js'
  },
  // define methods under the `methods` object
  methods: {
    greet: function (event) {
      // `this` inside methods point to the vm
      alert('Hello ' + this.name + '!')
      // `event` is the native DOM event
      alert(event.target.tagName)
    }
  }
})
</script>
{% endraw %}

## Inline Statement Handler

Instead of binding directly to a method name, we can also use an inline JavaScript statement:

``` html
<div id="example-2">
  <button v-on:click="say('hi')">Say Hi</button>
  <button v-on:click="say('what')">Say What</button>
</div>
```
``` js
new Uppy({
  el: '#example-2',
  methods: {
    say: function (msg) {
      alert(msg)
    }
  }
})
```

Result:
{% raw %}
<div id="example-2" class="demo">
  <button v-on:click="say('hi')">Say Hi</button>
  <button v-on:click="say('what')">Say What</button>
</div>
<script>
new Uppy({
  el: '#example-2',
  methods: {
    say: function (msg) {
      alert(msg)
    }
  }
})
</script>
{% endraw %}

Similar to the restrictions on inline expressions, event handlers are restricted to **one statement only**.

Sometimes we also need to access the original DOM event in an inline statement handler. You can pass it into a method using the special `$event` variable:

``` html
<button v-on:click="say('hello!', $event)">Submit</button>
```

``` js
// ...
methods: {
  say: function (msg, event) {
    // now we have access to the native event
    event.preventDefault()
  }
}
```

## Event Modifiers

It is a very common need to call `event.preventDefault()` or `event.stopPropagation()` inside event handlers. Although we can do this easily inside methods, it would be better if the methods can be purely about data logic rather than having to deal with DOM event details.

To address this problem, Uppy.js provides two **event modifiers** for `v-on`: `.prevent` and `.stop`. Recall that modifiers are directive postfixes denoted by a dot:

``` html
<!-- the click event's propagation will be stopped -->
<a v-on:click.stop="doThis"></a>

<!-- the submit event will no longer reload the page -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- modifiers can be chained -->
<a v-on:click.stop.prevent="doThat">

<!-- just the modifier -->
<form v-on:submit.prevent></form>
```

## Key Modifiers

When listening for keyboard events, we often need to check for common key codes. Uppy.js also allows adding key modifiers for `v-on` when listening for key events:

``` html
<!-- only call vm.submit() when the keyCode is 13 -->
<input v-on:keyup.13="submit">
```

Remembering all the keyCodes is a hassle, so Uppy.js provides aliases for most commonly used keys:

``` html
<!-- same as above -->
<input v-on:keyup.enter="submit">

<!-- also works for shorthand -->
<input @keyup.enter="submit">
```

Here's the full list of key modifier aliases:

- enter
- tab
- delete
- esc
- space
- up
- down
- left
- right

In addition, single letter key aliases are also supported in 1.0.8+.

## Why Listeners in HTML?

You might be concerned that this whole event listening approach violates the good old rules about "separation of concern". Rest assured - since all Uppy.js handler functions and expressions are strictly bound to the ViewModel that's handling the current View, it won't cause any maintenance difficulty. In fact, there are several benefits in using `v-on`:

1. It makes it easier to locate the handler function implementations within your JS code by simply skimming the HTML template.

2. Since you don't have to manually attach event listeners in JS, your ViewModel code can be pure logic and DOM-free. This makes it easier to test.

3. When a ViewModel is destroyed, all event listeners are automatically removed. You don't need to worry about cleaning it up yourself.
