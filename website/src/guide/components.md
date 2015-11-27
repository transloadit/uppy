---
title: Components
type: guide
order: 12
---

## Using Components

### Registration

We've learned in the previous sections that we can create a component constructor using `Uppy.extend()`:

``` js
var MyComponent = Uppy.extend({
  // options...
})
```

To use this constructor as a component, you need to **register** it with `Uppy.component(tag, constructor)`:

``` js
// Globally register the component with tag: my-component
Uppy.component('my-component', MyComponent)
```

Once registered, the component can now be used in a parent instance's template as a custom element, `<my-component>`. Make sure the component is registered **before** you instantiate your root Uppy instance. Here's the full example:

``` html
<div id="example">
  <my-component></my-component>
</div>
```

``` js
// define
var MyComponent = Uppy.extend({
  template: '<div>A custom component!</div>'
})

// register
Uppy.component('my-component', MyComponent)

// create a root instance
new Uppy({
  el: '#example'
})
```

Which will render:

``` html
<div id="example">
  <div>A custom component!</div>
</div>
```

{% raw %}
<div id="example" class="demo">
  <my-component></my-component>
</div>
<script>
Uppy.component('my-component', {
  template: '<div>A custom component!</div>'
})
new Uppy({ el: '#example' })
</script>
{% endraw %}

Note the component's template **replaces** the custom element, which only serves as a **mounting point**. This behavior can be configured using the `replace` instance option.

### Local Registration

You don't have to register every component globally. You can make a component available only in the scope of another component by registering it with the `components` instance option:

``` js
var Child = Uppy.extend({ /* ... */ })

var Parent = Uppy.extend({
  template: '...',
  components: {
    // <my-component> will only be available in Parent's template
    'my-component': Child
  }
})
```

The same encapsulation applies for other assets types such as directives, filters and transitions.

### Registration Sugar

To make things easier, you can directly pass in the options object instead of an actual constructor to `Uppy.component()` and the `component` option. Uppy.js will automatically call `Uppy.extend()` for you under the hood:

``` js
// extend and register in one step
Uppy.component('my-component', {
  template: '<div>A custom component!</div>'
})

// also works for local registration
var Parent = Uppy.extend({
  components: {
    'my-component': {
      template: '<div>A custom component!</div>'
    }
  }
})
```

### Component Option Caveats

Most of the options that can be passed into the Uppy constructor can be used in `Uppy.extend()`, with two special cases: `data` and `el`. Imagine we simply pass an object as `data` to `Uppy.extend()`:

``` js
var data = { a: 1 }
var MyComponent = Uppy.extend({
  data: data
})
```

The problem with this is that the same `data` object will be shared across all instances of `MyComponent`! This is most likely not what we want, so we should use a function that returns a fresh object as the `data` option:

``` js
var MyComponent = Uppy.extend({
  data: function () {
    return { a: 1 }
  }
})
```

The `el` option also requires a function value when used in `Uppy.extend()`, for exactly the same reason.

### `is` attribute

Some HTML elements, for example `<table>`, has restrictions on what elements can appear inside it. Custom elements that are not in the whitelist will be hoisted out and thus not render properly. In such cases you should use the `is` special attribute to indicate a custom element:

``` html
<table>
  <tr is="my-component"></tr>
</table>
```

## Props

### Passing Data with Props

Every component instance has its own **isolated scope**. This means you cannot (and should not) directly reference parent data in a child component's template. Data can be passed down to child components using **props**.

A "prop" is a field on a component's data that is expected to be passed down from its parent component. A child component needs to explicitly declare the props it expects to receive using the [`props` option](/api/#props):

``` js
Uppy.component('child', {
  // declare the props
  props: ['msg'],
  // the prop can be used inside templates, and will also
  // be set as `this.msg`
  template: '<span>{{ msg }}</span>'
})
```

Then, we can pass a plain string to it like so:

``` html
<child msg="hello!"></child>
```

**Result:**

{% raw %}
<div id="prop-example-1" class="demo">
  <child msg="hello!"></child>
</div>
<script>
new Uppy({
  el: '#prop-example-1',
  components: {
    child: {
      props: ['msg'],
      template: '<span>{{ msg }}</span>'
    }
  }
})
</script>
{% endraw %}

### camelCase vs. kebab-case

HTML attributes are case-insensitive. When using camelCased prop names as attributes, you need to use their kebab-case (hyphen-delimited) equivalents:

``` js
Uppy.component('child', {
  // camelCase in JavaScript
  props: ['myMessage'],
  template: '<span>{{ myMessage }}</span>'
})
```

``` html
<!-- kebab-case in HTML -->
<child my-message="hello!"></child>
```

### Dynamic Props

Similar to binding a normal attribute to an expression, we can also use `v-bind` for dynamically binding props to data on the parent. Whenever the data is updated in the parent, it will also flow down to the child:

``` html
<div>
  <input v-model="parentMsg">
  <br>
  <child v-bind:my-message="parentMsg"></child>
</div>
```

It is often simpler to use the shorthand syntax for `v-bind`:

``` html
<child :my-message="parentMsg"></child>
```

**Result:**

{% raw %}
<div id="demo-2" class="demo">
  <input v-model="parentMsg">
  <br>
  <child v-bind:my-message="parentMsg"></child>
</div>
<script>
new Uppy({
  el: '#demo-2',
  data: {
    parentMsg: 'Message from parent'
  },
  components: {
    child: {
      props: ['myMessage'],
      template: '<span>{{myMessage}}</span>'
    }
  }
})
</script>
{% endraw %}

### Literal vs. Dynamic

A common mistake beginners tend to make is attempting to pass down a number using the literal syntax:

``` html
<!-- this passes down a plain string "1" -->
<comp some-prop="1"></comp>
```

However, since this is a literal prop, its value is passed down a the plain string `"1"`, instead of an actual number. If we want to pass down an actual JavaScript number, we need to use the dynamic syntax to make its value be evaluated as a JavaScript expression:

``` html
<!-- this passes down an actual number -->
<comp :some-prop="1"></comp>
```

### Prop Binding Types

By default, all props form a **one-way-down** binding between the child property and the parent one: when the parent property updates, it will flow down to the child, but not the other way around. This default is meant to prevent child components from accidentally mutating the parent's state, which can make your app's data flow harder to reason about. However, it is also possible to explicitly enforce a two-way or a one-time binding with the `.sync` and `.once` **binding type modifiers**:

Compare the syntax:

``` html
<!-- default, one-way-down binding -->
<child :msg="parentMsg"></child>

<!-- explicit two-way binding -->
<child :msg.sync="parentMsg"></child>

<!-- explicit one-time binding -->
<child :msg.once="parentMsg"></child>
```

The two-way binding will sync the change of child's `msg` property back to the parent's `parentMsg` property. The one-time binding, once set up, will not sync future changes between the parent and the child.

<p class="tip">Note that if the prop being passed down is an Object or an Array, it is passed by reference. Mutating the Object or Array itself inside the child **will** affect parent state, regardless of the binding type you are using.</p>

### Prop Validation

It is possible for a component to specify the requirements for the props it is receiving. This is useful when you are authoring a component that is intended to be used by others, as these prop validation requirements essentially constitute your component's API, and ensure your users are using your component correctly. Instead of defining the props as an array of strings, you can use the object hash format that contain validation requirements:

``` js
Uppy.component('example', {
  props: {
    // basic type check (`null` means accept any type)
    propA: Number,
    // a required string
    propB: {
      type: String,
      required: true
    },
    // a number with default value
    propC: {
      type: Number,
      default: 100
    },
    // object/array defaults should be returned from a
    // factory function
    propD: {
      type: Object,
      default: function () {
        return { msg: 'hello' }
      }
    },
    // indicate this prop expects a two-way binding. will
    // raise a warning if binding type does not match.
    propE: {
      twoWay: true
    },
    // custom validator function
    propF: {
      validator: function (value) {
        return value > 10
      }
    }
  }
})
```

The `type` can be one of the following native constructors:

- String
- Number
- Boolean
- Function
- Object
- Array

In addition, `type` can also be a custom constructor function and the assertion will be made with an `instanceof` check.

When a prop validation fails, Uppy will refuse to set the value on the child component, and throw a warning if using the development build.

## Parent-Child Communication

### Parent Chain

A child component holds access to its parent component as `this.$parent`. A root Uppy instance will be available to all of its descendants as `this.$root`. Each parent component has an array, `this.$children`, which contains all its child components.

Although it's possible to access any instance the parent chain, you should avoid directly relying on parent data in a child component and prefer passing data down explicitly using props. In addition, it is a very bad idea to mutate parent state from a child component, because:

1. It makes the parent and child tightly coupled;

2. It makes the parent state much harder to reason about when looking at it alone, because its state may be modified by any child! Ideally, only a component itself should be allowed to modify its own state.

### Custom Events

All Uppy instances implement a custom event interface that facilitates communication within a component tree. This event system is independent from the native DOM events and works differently.

Each Uppy instance is an event emitter that can:

- Listen to events using `$on()`;

- Trigger events on self using `$emit()`;

- Dispatch an event that propagates upward along the parent chain using `$dispatch()`;

- Broadcast an event that propagates downward to all descendants using `$broadcast()`.

<p class="tip">Unlike DOM events, Uppy events will automatically stop propagation after triggering callbacks for the first time along a propagation path, unless the callback explicitly returns `true`.</p>

A simple example:

``` html
<!-- template for child -->
<template id="child-template">
  <input v-model="msg">
  <button v-on:click="notify">Dispatch Event</button>
</template>

<!-- template for parent -->
<div id="events-example">
  <p>Messages: {{ messages | json }}</p>
  <child></child>
</div>
```

``` js
// register child, which dispatches an event with
// the current message
Uppy.component('child', {
  template: '#child-template',
  data: function () {
    return { msg: 'hello' }
  },
  methods: {
    notify: function () {
      if (this.msg.trim()) {
        this.$dispatch('child-msg', this.msg)
        this.msg = ''
      }
    }
  }
})

// bootstrap parent, which pushes message into an array
// when receiving the event
var parent = new Uppy({
  el: '#events-example',
  data: {
    messages: []
  },
  // the `events` option simply calls `$on` for you
  // when the instance is created
  events: {
    'child-msg': function (msg) {
      // `this` in event callbacks are automatically bound
      // to the instance that registered it
      this.messages.push(msg)
    }
  }
})
```

{% raw %}
<template id="child-template">
  <input v-model="msg">
  <button v-on:click="notify">Dispatch Event</button>
</template>

<div id="events-example" class="demo">
  <p>Messages: {{ messages | json }}</p>
  <child></child>
</div>
<script>
Uppy.component('child', {
  template: '#child-template',
  data: function () {
    return { msg: 'hello' }
  },
  methods: {
    notify: function () {
      if (this.msg.trim()) {
        this.$dispatch('child-msg', this.msg)
        this.msg = ''
      }
    }
  }
})

var parent = new Uppy({
  el: '#events-example',
  data: {
    messages: []
  },
  events: {
    'child-msg': function (msg) {
      this.messages.push(msg)
    }
  }
})
</script>
{% endraw %}

### v-on for Custom Events

The example above is pretty nice, but when we are looking at the parent's code, it's not so obvious where the `"child-msg"` event comes from. It would be better if we can declare the event handler in the template, right where the child component is used. To make this possible, `v-on` can be used to listen for custom events when used on a child component:

``` html
<child v-on:child-msg="handleIt"></child>
```

This makes things very clear: when the child triggers the `"child-msg"` event, the parent's `handleIt` method will be called. Any code that affects the parent's state will be inside the `handleIt` parent method; the child is only concerned with triggering the event.

### Child Component Refs

Despite the existence of props and events, sometimes you might still need to directly access a child component in JavaScript. To achieve this you have to assign a reference ID to the child component using `v-ref`. For example:

``` html
<div id="parent">
  <user-profile v-ref:profile></user-profile>
</div>
```

``` js
var parent = new Uppy({ el: '#parent' })
// access child component instance
var child = parent.$refs.profile
```

When `v-ref` is used together with `v-for`, the ref you get will be an Array or an Object containing the child components mirroring the data source.

## Content Distribution with Slots

When using components, it is often desired to compose them like this:

``` html
<app>
  <app-header></app-header>
  <app-footer></app-footer>
</app>
```

There are two things to note here:

1. The `<app>` component does not know what content may be present inside its mount target. It is decided by whatever parent component that is using `<app>`.

2. The `<app>` component very likely has its own template.

To make the composition work, we need a way to interweave the parent "content" and the component's own template. This is a process called **content distribution** (or "transclusion" if you are familiar with Angular). Uppy.js implements a content distribution API that is modeled after with the current [Web Components spec draft](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Slots-Proposal.md), using the special `<slot>` element to serve as distribution outlets for the original content.

### Compilation Scope

Before we dig into the API, let's first clarify which scope the contents are compiled in. Imagine a template like this:

``` html
<child>
  {{ msg }}
</child>
```

Should the `msg` be bound to the parent's data or the child data? The answer is parent. A simple rule of thumb for component scope is:

> Everything in the parent template is compiled in parent scope; everything in the child template is compiled in child scope.

A common mistake is trying to bind a directive to a child property/method in the parent template:

``` html
<!-- does NOT work -->
<child v-show="someChildProperty"></child>
```

Assuming `someChildProperty` is a property on the child component, the example above would not work as intended. The parent's template should not be aware of the state of a child component.

If you need to bind child-scope directives on a component root node, you should do so in the child component's own template:

``` js
Uppy.component('child-component', {
  // this does work, because we are in the right scope
  template: '<div v-show="someChildProperty">Child</div>',
  data: function () {
    return {
      someChildProperty: true
    }
  }
})
```

Similarly, distributed content will be compiled in the parent scope.

### Single Slot

Parent content will be **discarded** unless the child component template contains at least one `<slot>` outlet. When there is only one slot with no attributes, the entire content fragment will be inserted at its position in the DOM, replacing the slot itself.

Anything originally inside the `<slot>` tags is considered **fallback content**. Fallback content is compiled in the child scope and will only be displayed if the hosting element is empty and has no content to be inserted.

Suppose we have a component with the following template:

``` html
<div>
  <h1>This is my component!</h1>
  <slot>
    This will only be displayed if there is no content
    to be distributed.
  </slot>
</div>
```

Parent markup that uses the component:

``` html
<my-component>
  <p>This is some original content</p>
  <p>This is some more original content</p>
</my-component>
```

The rendered result will be:

``` html
<div>
  <h1>This is my component!</h1>
  <p>This is some original content</p>
  <p>This is some more original content</p>
</div>
```

### Named Slots

`<slot>` elements have a special attribute, `name`, which can be used to further customize how content should be distributed. You can have multiple slots with different names. A named slot will match any element that has a corresponding `slot` attribute in the content fragment.

There can still be one unnamed slot, which is the **default slot** that serves as a catch-all outlet for any unmatched content. If there is no default slot, unmatched content will be discarded.

For example, suppose we have a `multi-insertion` component with the following template:

``` html
<div>
  <slot name="one"></slot>
  <slot></slot>
  <slot name="two"></slot>
</div>
```

Parent markup:

``` html
<multi-insertion>
  <p slot="one">One</p>
  <p slot="two">Two</p>
  <p>Default A</p>
</multi-insertion>
```

The rendered result will be:

``` html
<div>
  <p slot="one">One</p>
  <p>Default A</p>
  <p slot="two">Two</p>
</div>
```

The content distribution API is a very useful mechanism when designing components that are meant to be composed together.

## Dynamic Components

You can use the same mount point and dynamically switch between multiple components by using the reserved `<component>` element and dynamically bind to its `is` attribute:

``` js
new Uppy({
  el: 'body',
  data: {
    currentView: 'home'
  },
  components: {
    home: { /* ... */ },
    posts: { /* ... */ },
    archive: { /* ... */ }
  }
})
```

``` html
<component :is="currentView">
  <!-- component changes when vm.currentview changes! -->
</component>
```

If you want to keep the switched-out components alive so that you can preserve its state or avoid re-rendering, you can add a `keep-alive` directive param:

``` html
<component :is="currentView" keep-alive>
  <!-- inactive components will be cached! -->
</component>
```

### `activate` Hook

When switching components, the incoming component might need to perform some asynchronous operation before it should be swapped in. To control the timing of component swapping, implement the `activate` hook on the incoming component:

``` js
Uppy.component('activate-example', {
  activate: function (done) {
    var self = this
    loadDataAsync(function (data) {
      self.someData = data
      done()
    })
  }
})
```

Note the `activate` hook is only respected during dynamic component swapping or the initial render for static components - it does not affect manual insertions with instance methods.

### `transition-mode`

The `transition-mode` param attribute allows you to specify how the transition between two dynamic components should be executed.

By default, the transitions for incoming and outgoing components happen simultaneously. This attribute allows you to configure two other modes:

- `in-out`: New component transitions in first, current component transitions out after incoming transition has finished.

- `out-in`: Current component transitions out first, new component transitions in after outgoing transition has finished.

**Example**

``` html
<!-- fade out first, then fade in -->
<component
  :is="view"
  transition="fade"
  transition-mode="out-in">
</component>
```

``` css
.fade-transition {
  transition: opacity .3s ease;
}
.fade-enter, .fade-leave {
  opacity: 0;
}
```

{% raw %}
<div id="transition-mode-demo" class="demo">
  <input v-model="view" type="radio" value="v-a" id="a" name="view"><label for="a">A</label>
  <input v-model="view" type="radio" value="v-b" id="b" name="view"><label for="b">B</label>
  <component
    :is="view"
    transition="fade"
    transition-mode="out-in">
  </component>
</div>
<style>
  .fade-transition {
    transition: opacity .3s ease;
  }
  .fade-enter, .fade-leave {
    opacity: 0;
  }
</style>
<script>
new Uppy({
  el: '#transition-mode-demo',
  data: {
    view: 'v-a'
  },
  components: {
    'v-a': {
      template: '<div>Component A</div>'
    },
    'v-b': {
      template: '<div>Component B</div>'
    }
  }
})
</script>
{% endraw %}

## Misc

### Components and v-for

You can directly use `v-for` on the custom component, like any normal element:

``` html
<my-component v-for="item in items"></my-component>
```

However, this won't pass any data to the component, because components have isolated scopes of their own. In order to pass the iterated data into the component, we should also use props:

``` html
<my-component
  v-for="item in items"
  :item="item"
  :index="$index">
</my-component>
```

The reason for not automatically injecting `item` into the component is because that makes the component tightly coupled to how `v-for` works. Being explicit about where its data comes from makes the component reusable in other situations.

### Authoring Reusable Components

When authoring components, it is good to keep in mind whether you intend to reuse this component somewhere else later. It is OK for one-off components to have some tight coupling with each other, but reusable components should define a clean public interface.

The API for a Uppy.js component essentially comes in three parts - props, events and slots:

- **Props** allow the external environment to feed data to the component;

- **Events** allow the component to trigger actions in the external environment;

- **Slots** allow the external environment to insert content into the component's view structure.

With the dedicated shorthand syntax for `v-bind` and `v-on`, the intents can be clearly and succinctly conveyed in the template:

``` html
<my-component
  :foo="baz"
  :bar="qux"
  @event-a="doThis"
  @event-b="doThat">
  <!-- content -->
  <img slot="icon" src="...">
  <p slot="main-text">Hello!</p>
</my-component>
```

### Async Components

In large applications, we may need to divide the app into smaller chunks, and only load a component from the server when it is actually needed. To make that easier, Uppy.js allows you to define your component as a factory function that asynchronously resolves your component definition. Uppy.js will only trigger the factory function when the component actually needs to be rendered, and will cache the result for future re-renders. For example:

``` js
Uppy.component('async-example', function (resolve, reject) {
  setTimeout(function () {
    resolve({
      template: '<div>I am async!</div>'
    })
  }, 1000)
})
```

The factory function receives a `resolve` callback, which should be called when you have retrieved your component definition from the server. You can also call `reject(reason)` to indicate the load has failed. The `setTimeout` here is simply for demonstration; How to retrieve the component is entirely up to you. One recommended approach is to use async components together with [Webpack's code-splitting feature](http://webpack.github.io/docs/code-splitting.html):

``` js
Uppy.component('async-webpack-example', function (resolve) {
  // this special require syntax will instruct webpack to
  // automatically split your built code into bundles which
  // are automatically loaded over ajax requests.
  require(['./my-async-component'], resolve)
})
```

### Assets Naming Convention

Some assets, such as components and directives, appear in templates in the form of HTML attributes or HTML custom tags. Since HTML attribute names and tag names are **case-insensitive**, we often need to name our assets using kebab-case instead of camelCase, which can be a bit inconvenient.

Uppy.js actually supports naming your assets using camelCase or PascalCase, and automatically resolves them as kebab-case in templates (similar to the name conversion for props):

``` js
// in a component definition
components: {
  // register using camelCase
  myComponent: { /*... */ }
}
```

``` html
<!-- use dash case in templates -->
<my-component></my-component>
```

This works nicely with [ES6 object literal shorthand](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6):

``` js
// PascalCase
import TextBox from './components/text-box';
import DropdownMenu from './components/dropdown-menu';

export default {
  components: {
    // use in templates as <text-box> and <dropdown-menu>
    TextBox,
    DropdownMenu
  }
}
```

### Recursive Component

Components can recursively invoke itself in its own template, however, it can only do so when it has the `name` option:

``` js
var StackOverflow = Uppy.extend({
  name: 'stack-overflow',
  template:
    '<div>' +
      // recursively invoke self
      '<stack-overflow></stack-overflow>' +
    '</div>'
})
```

A component like the above will result in a "max stack size exceeded" error, so make sure recursive invocation is conditional. When you register a component globally using `Uppy.component()`, the global ID is automatically set as the component's `name` option.

### Fragment Instance

When you use the `template` option, the content of the template will replace the element the Uppy instance is mounted on. It is therefore recommended to always include a single root-level element in templates.

There are a few conditions that will turn a Uppy instance into a **fragment instance**:

1. Template contains multiple top-level elements.
2. Template contains only plain text.
3. Template contains only another component.
4. Template contains only an element directive, e.g. `<partial>` or uppy-router's `<router-view>`.
5. Template root node has a flow-control directive, e.g. `v-if` or `v-for`.

The reason is that all of the above cause the instance to have an unknown number of top-level elements, so it has to manage its DOM content as a fragment. A fragment instance will still render the content correctly. However, it will **not** have a root node, and its `$el` will point to an "anchor node", which is an empty Text node (or a Comment node in debug mode).

What's more important though, is that **non-flow-control directives, non-prop attributes and transitions on the component element will be ignored**, because there is no root element to bind them to:

``` html
<!-- doesn't work due to no root element -->
<example v-show="ok" transition="fade"></example>

<!-- props work -->
<example :prop="someData"></example>

<!-- flow control works, but without transitions -->
<example v-if="ok"></example>
```

There are, of course, valid use cases for fragment instances, but it is in general a good idea to give your component template a single, plain root element. It ensures directives and attributes on the component element to be properly transferred, and also results in slightly better performance.

### Inline Template

When the `inline-template` special attribute is present on a child component, the component will use its inner content as its template, rather than treating it as distributed content. This allows more flexible template-authoring.

``` html
<my-component inline-template>
  <p>These are compiled as the component's own template</p>
  <p>Not parent's transclusion content.</p>
</my-component>
```

However, `inline-template` makes the scope of your templates harder to reason about, and makes the component's template compilation un-cachable. As a best practice, prefer defining templates inside the component using the `template` option.
