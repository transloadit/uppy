---
title: Computed Properties
type: guide
order: 5
---

In-template expressions are very convenient, but they are really meant for simple operations only. Templates are meant to describe the structure of your view. Putting too much logic into your templates can make them bloated and hard to maintain. This is why Uppy.js limits binding expressions to one expression only. For any logic that requires more than one expression, you should use a **computed property**.

### Basic Example

``` html
<div id="example">
  a={{ a }}, b={{ b }}
</div>
```

``` js
var vm = new Uppy({
  el: '#example',
  data: {
    a: 1
  },
  computed: {
    // a computed getter
    b: function () {
      // `this` points to the vm instance
      return this.a + 1
    }
  }
})
```

Result:

{% raw %}
<div id="example" class="demo">
  a={{ a }}, b={{ b }}
</div>
<script>
var vm = new Uppy({
  el: '#example',
  data: {
    a: 1
  },
  computed: {
    b: function () {
      return this.a + 1
    }
  }
})
</script>
{% endraw %}

Here we have declared a computed property `b`. The function we provided will be used as the getter function for the property `vm.b`:

``` js
console.log(vm.b) // -> 2
vm.a = 2
console.log(vm.b) // -> 3
```

You can open the console and play with the example vm yourself. The value of `vm.b` is always dependent on the value of `vm.a`.

You can data-bind to computed properties in templates just like a normal property. Uppy is aware that `vm.b` depends on `vm.a`, so it will update any bindings that depends on `vm.b` when `vm.a` changes. And the best part is that we've created this dependency relationship declaratively: the computed getter function is pure and has no side effects, which makes it easy to test and reason about.

### Computed Property vs. $watch

Uppy.js does provide an API method called `$watch` that allows you to observe data changes on a Uppy instance. When you have some data that needs to change based on some other data, it is tempting to use `$watch` - especially if you are coming from an AngularJS background. However, it is often a better idea to use a computed property rather than an imperative `$watch` callback. Consider this example:

``` html
<div id="demo">{{fullName}}</div>
```

``` js
var vm = new Uppy({
  data: {
    firstName: 'Foo',
    lastName: 'Bar',
    fullName: 'Foo Bar'
  }
})

vm.$watch('firstName', function (val) {
  this.fullName = val + ' ' + this.lastName
})

vm.$watch('lastName', function (val) {
  this.fullName = this.firstName + ' ' + val
})
```

The above code is imperative and repetitive. Compare it with a computed property version:

``` js
var vm = new Uppy({
  data: {
    firstName: 'Foo',
    lastName: 'Bar'
  },
  computed: {
    fullName: function () {
      return this.firstName + ' ' + this.lastName
    }
  }
})
```

Much better, isn't it?

### Computed Setter

Computed properties are by default getter-only, but you can also provide a setter when you need it:

``` js
// ...
computed: {
  fullName: {
    // getter
    get: function () {
      return this.firstName + ' ' + this.lastName
    },
    // setter
    set: function (newValue) {
      var names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[names.length - 1]
    }
  }
}
// ...
```

Now when you call `vm.fullName = 'John Doe'`, the setter will be invoked and `vm.firstName` and `vm.lastName` will be updated accordingly.

The technical details behind how computed properties are updated are [discussed in another section](reactivity.html#Inside_Computed_Properties) dedicated to the reactivity system.
