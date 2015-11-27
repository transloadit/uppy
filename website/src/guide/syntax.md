---
title: Data Binding Syntax
type: guide
order: 4
---

Uppy.js uses a DOM-based templating implementation. This means that all Uppy.js templates are essentially valid, parsable HTML enhanced with some special attributes. Keep that in mind, since this makes Uppy templates fundamentally different from string-based templates.

## Interpolations

### Text

The most basic form of data binding is text interpolation using the "Mustache" syntax (double curly braces):

``` html
<span>Message: {{ msg }}</span>
```

The mustache tag will be replaced with the value of the `msg` property on the corresponding data object. It will also be updated whenever the data object's `msg` property changes.

You can also perform one-time interpolations that do not update on data change:

``` html
<span>This will never change: {{* msg }}</span>
```

### Raw HTML

The double mustaches interprets the data as plain text, not HTML. In order to output real HTML, you will need to use triple mustaches:

``` html
<div>{{{ raw_html }}}</div>
```

The contents are inserted as plain HTML - data bindings are ignored. If you need to reuse template pieces, you should use [partials](/api/#partial).

<p class="tip">Dynamically rendering arbitrary HTML on your website can be very dangerous because it can easily lead to [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). Only use HTML interpolation on trusted content and **never** on user-provided content.</p>

### Attributes

Mustaches can also be used inside HTML attributes:

``` html
<div id="item-{{ id }}"></div>
```

Note that attribute interpolations are disallowed in Uppy.js directives and special attributes. Don't worry, Uppy.js will raise warnings for you when mustaches are used in wrong places.

## Binding Expressions

The text we put inside mustache tags are called **binding expressions**. In Uppy.js, a binding expression consists of a single JavaScript expression optionally followed by one or more filters.

### JavaScript Expressions

So far we've only been binding to simple property keys in our templates. But Uppy.js actually supports the full power of JavaScript expressions inside data bindings:

``` html
{{ number + 1 }}

{{ ok ? 'YES' : 'NO' }}

{{ message.split('').reverse().join('') }}
```

These expressions will be evaluated in the data scope of the owner Uppy instance. One restriction is that each binding can only contain **one single expression**, so the following will **NOT** work:

``` html
<!-- this is a statement, not an expression: -->
{{ var a = 1 }}

<!-- flow control won't work either, use ternary expressions -->
{{ if (ok) { return message } }}
```

### Filters

Uppy.js allows you to append optional "filters" to the end of an expression, denoted by the "pipe" symbol:

``` html
{{ message | capitalize }}
```

Here we are "piping" the value of the `message` expression through the built-in `capitalize` filter, which is in fact just a JavaScript function that returns the capitalized value. Uppy.js provides a number of built-in filters, and we will talk about how to write your own filters later.

Note that the pipe syntax is not part of JavaScript syntax, therefore you cannot mix filters inside expressions; you can only append them at the end of an expression.

Filters can be chained:

``` html
{{ message | filterA | filterB }}
```

Filters can also take arguments:

``` html
{{ message | filterA 'arg1' arg2 }}
```

The filter function always receives the expression's value as the first argument. Quoted arguments are interpreted as plain string, while un-quoted ones will be evaluated as expressions. Here, the plain string `'arg1'` will be passed into the filter as the second argument, and the value of expression `arg2` will be evaluated and passed in as the third argument.

## Directives

Directives are special attributes with the `v-` prefix. Directive attribute values are expected to be **binding expressions**, so the rules about JavaScript expressions and filters mentioned above apply here as well. A directive's job is to reactively apply special behavior to the DOM when the value of its expression changes. Let's review the example we've seen in the introduction:

``` html
<p v-if="greeting">Hello!</p>
```

Here, the `v-if` directive would remove/insert the `<p>` element based on the truthiness of the value of the expression `greeting`.

### Arguments

Some directives can take an "argument", denoted by a colon after the directive name. For example, the `v-bind` directive is used to reactively update an HTML attribute:

``` html
<a v-bind:href="url"></a>
```

Here `href` is the argument, which tells the `v-bind` directive to bind the element's `href` attribute to the value of the expression `url`. You may have noticed this achieves the same result as an attribute interpolation using `{% raw %}href="{{url}}"{% endraw %}`: that is correct, and in fact, attribute interpolations are translated into `v-bind` bindings internally.

Another example is the `v-on` directive, which listens to DOM events:

``` html
<a v-on:click="doSomething">
```

Here the argument is the event name to listen to. We will talk about event handling in more details too.

### Modifiers

Modifiers are special postfixes denoted by a dot, which indicates that a directive should be bound in some special way. For example, the `.literal` modifier tells the directive to interpret its attribute value as a literal string rather than an expression:

``` html
<a v-bind:href.literal="/a/b/c"></a>
```

Of course, this seems pointless because we can just do `href="/a/b/c"` instead of using a directive. The example here is just for demonstrating the syntax. We will see more practical uses of modifiers later.

## Shorthands

The `v-` prefix serves as a visual cue for identifying Uppy-specific attributes in your templates. This is useful when you are using Uppy.js to apply dynamic behavior to some existing markup, but can feel verbose for some frequently used directives. At the same time, the need for the `v-` prefix becomes less important when you are building an SPA where Uppy.js manages every template. Therefore, Uppy.js provides special shorthands for two of the most often used directives, `v-bind` and `v-on`:

### `v-bind` Shorthand

``` html
<!-- full syntax -->
<a v-bind:href="url"></a>

<!-- shorthand -->
<a :href="url"></a>

or

<!-- full syntax -->
<button v-bind:disabled="someDynamicCondition">Button</button>

<!-- shorthand -->
<button :disabled="someDynamicCondition">Button</button>
```


### `v-on` Shorthand

``` html
<!-- full syntax -->
<a v-on:click="doSomething"></a>

<!-- shorthand -->
<a @click="doSomething"></a>
```

They may look a bit different from "valid" HTML, but all Uppy.js supported browsers can parse it correctly, and they do not appear in the final rendered markup. The shorthand syntax is totally optional, but you will likely appreciate it when you learn more about its usage later.
