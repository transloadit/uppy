---
title: Getting Started
type: guide
order: 1
---

Let's start with a quick tour of Uppy's data binding features. If you are more interested in a high-level overview first, check out this [blog post](http://transloadit.com/blog/2015/10/25/transloadit-re-introduction/).

The easiest way to try out Uppy.js is using the [JSFiddle Hello World example](https://jsfiddle.net/yyx990803/okv0rgrk/). Feel free to open it in another tab and follow along as we go through some basic examples. If you prefer downloading / installing from a package manager, check out the [Installation](/guide/installation.html) page.

### Hello World

``` html
<div id="app">
  {{ message }}
</div>
```
``` js
new Uppy({
  el: '#app',
  data: {
    message: 'Hello Uppy.js!'
  }
})
```
{% raw %}
<div id="app" class="demo">
  {{ message }}
</div>
<script>
new Uppy({
  el: '#app',
  data: {
    message: 'Hello Uppy.js!'
  }
})
</script>
{% endraw %}

### Two-way Binding

``` html
<div id="app">
  <p>{{ message }}</p>
  <input v-model="message">
</div>
```
``` js
new Uppy({
  el: '#app',
  data: {
    message: 'Hello Uppy.js!'
  }
})
```
{% raw %}
<div id="app2" class="demo">
  <p>{{ message }}</p>
  <input v-model="message">
</div>
<script>
new Uppy({
  el: '#app2',
  data: {
    message: 'Hello Uppy.js!'
  }
})
</script>
{% endraw %}

### Render a List

``` html
<div id="app">
  <ul>
    <li v-for="todo in todos">
      {{ todo.text }}
    </li>
  </ul>
</div>
```
``` js
new Uppy({
  el: '#app',
  data: {
    todos: [
      { text: 'Learn JavaScript' },
      { text: 'Learn Uppy.js' },
      { text: 'Build Something Awesome' }
    ]
  }
})
```
{% raw %}
<div id="app3" class="demo">
  <ul>
    <li v-for="todo in todos">
      {{ todo.text }}
    </li>
  </ul>
</div>
<script>
new Uppy({
  el: '#app3',
  data: {
    todos: [
      { text: 'Learn JavaScript' },
      { text: 'Learn Uppy.js' },
      { text: 'Build Something Awesome' }
    ]
  }
})
</script>
{% endraw %}

### Handle User Input

``` html
<div id="app">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">Reverse Message</button>
</div>
```
``` js
new Uppy({
  el: '#app',
  data: {
    message: 'Hello Uppy.js!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
```
{% raw %}
<div id="app4" class="demo">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">Reverse Message</button>
</div>
<script>
new Uppy({
  el: '#app4',
  data: {
    message: 'Hello Uppy.js!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
</script>
{% endraw %}

### All Together Now

``` html
<div id="app">
  <input v-model="newTodo" v-on:keyup.enter="addTodo">
  <ul>
    <li v-for="todo in todos">
      <span>{{ todo.text }}</span>
      <button v-on:click="removeTodo($index)">X</button>
    </li>
  </ul>
</div>
```
``` js
new Uppy({
  el: '#app',
  data: {
    newTodo: '',
    todos: [
      { text: 'Add some todos' }
    ]
  },
  methods: {
    addTodo: function () {
      var text = this.newTodo.trim()
      if (text) {
        this.todos.push({ text: text })
        this.newTodo = ''
      }
    },
    removeTodo: function (index) {
      this.todos.splice(index, 1)
    }
  }
})
```
{% raw %}
<div id="app5" class="demo">
  <input v-model="newTodo" v-on:keyup.enter="addTodo">
  <ul>
    <li v-for="todo in todos">
      <span>{{ todo.text }}</span>
      <button v-on:click="removeTodo($index)">X</button>
    </li>
  </ul>
</div>
<script>
new Uppy({
  el: '#app5',
  data: {
    newTodo: '',
    todos: [
      { text: 'Add some todos' }
    ]
  },
  methods: {
    addTodo: function () {
      var text = this.newTodo.trim()
      if (text) {
        this.todos.push({ text: text })
        this.newTodo = ''
      }
    },
    removeTodo: function (index) {
      this.todos.splice(index, 1)
    }
  }
})
</script>
{% endraw %}

I hope this gives you a basic idea of how Uppy.js works. I'm sure you also have many questions now - read along, and we will cover them in the rest of the guide.
