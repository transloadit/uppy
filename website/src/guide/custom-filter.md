---
title: Custom Filters
type: guide
order: 15
---

## Basics

Similar to custom directives, you can register a custom filter with the global `Uppy.filter()` method, passing in a **filterID** and a **filter function**. The filter function takes a value as the argument and returns the transformed value:

``` js
Uppy.filter('reverse', function (value) {
  return value.split('').reverse().join('')
})
```

``` html
<!-- 'abc' => 'cba' -->
<span v-text="message | reverse"></span>
```

The filter function also receives any inline arguments:

``` js
Uppy.filter('wrap', function (value, begin, end) {
  return begin + value + end
})
```

``` html
<!-- 'hello' => 'before hello after' -->
<span v-text="message | wrap 'before' 'after'"></span>
```

## Two-way Filters

Up till now we have used filters to transform values coming from the model and before displaying them in the view. But it is also possible to define a filter that transforms the value before it is written back to the model from the view (input elements):

``` js
Uppy.filter('currencyDisplay', {
  // model -> view
  // formats the value when updating the input element.
  read: function(val) {
    return '$'+val.toFixed(2)
  },
  // view -> model
  // formats the value when writing to the data.
  write: function(val, oldVal) {
    var number = +val.replace(/[^\d.]/g, '')
    return isNaN(number) ? 0 : parseFloat(number.toFixed(2))
  }
})
```

Demo:

{% raw %}
<div id="two-way-filter-demo" class="demo">
  <input type="text" v-model="money | currencyDisplay">
  <p>Model value: {{money}}</p>
</div>
<script>
new Uppy({
  el: '#two-way-filter-demo',
  data: {
    money: 123.45
  },
  filters: {
    currencyDisplay: {
      read: function(val) {
        return '$'+val.toFixed(2)
      },
      write: function(val, oldVal) {
        var number = +val.replace(/[^\d.]/g, '')
        return isNaN(number) ? 0 : parseFloat(number.toFixed(2))
      }
    }
  }
})
</script>
{% endraw %}

## Dynamic Arguments

If a filter argument is not enclosed by quotes, it will be evaluated dynamically in the current vm's data context. In addition, the filter function is always invoked using the current vm as its `this` context. For example:

``` html
<input v-model="userInput">
<span>{{msg | concat userInput}}</span>
```

``` js
Uppy.filter('concat', function (value, input) {
  // here `input` === `this.userInput`
  return value + input
})
```

For this simple example above, you can achieve the same result with just an expression, but for more complicated procedures that need more than one statement, you need to put them either in a computed property or a custom filter.

The built-in `filterBy` and `orderBy` filters are both filters that perform non-trivial work on the Array being passed in and relies on the current state of the owner Uppy instance.
