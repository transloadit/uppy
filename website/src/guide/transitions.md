---
title: Transitions
type: guide
order: 11
---

With Uppy.js' transition system you can apply automatic transition effects when elements are inserted into or removed from the DOM. Uppy.js will automatically add/remove CSS classes at appropriate times to trigger CSS transitions or animations for you, and you can also provide JavaScript hook functions to perform custom DOM manipulations during the transition.

To apply transition effects, you need to use the special `transition` attribute on the target element:

``` html
<div v-if="show" transition="my-transition"></div>
```

The `transition` attribute can be used together with:

- `v-if`
- `v-show`
- `v-for` (triggered for insertion and removal only)
- Dynamic components (introduced in the [next section](components.html#Dynamic_Components))
- On a component root node, and triggered via Uppy instance DOM methods, e.g. `vm.$appendTo(el)`.

When an element with transition is inserted or removed, Uppy will:

1. Try to find a JavaScript transition hooks object registered either through `Uppy.transition(id, hooks)` or passed in with the `transitions` option, using the id `"my-transition"`. If it finds it, it will call the appropriate hooks at different stages of the transition.

2. Automatically sniff whether the target element has CSS transitions or CSS animations applied, and add/remove the CSS classes at the appropriate times.

3. If no JavaScript hooks are provided and no CSS transitions/animations are detected, the DOM operation (insertion/removal) is executed immediately on next frame.

## CSS Transitions

### Example

A typical CSS transition looks like this:

``` html
<div v-if="show" transition="expand">hello</div>
```

You also need to define CSS rules for `.expand-transition`, `.expand-enter` and `.expand-leave` classes:

``` css
/* always present */
.expand-transition {
  transition: all .3s ease;
  height: 30px;
  padding: 10px;
  background-color: #eee;
  overflow: hidden;
}

/* .expand-enter defines the starting state for entering */
/* .expand-leave defines the ending state for leaving */
.expand-enter, .expand-leave {
  height: 0;
  padding: 0 10px;
  opacity: 0;
}
```

In addition, you can provide JavaScript hooks:

``` js
Uppy.transition('expand', {

  beforeEnter: function (el) {
    el.textContent = 'beforeEnter'
  },
  enter: function (el) {
    el.textContent = 'enter'
  },
  afterEnter: function (el) {
    el.textContent = 'afterEnter'
  },
  enterCancelled: function (el) {
    // handle cancellation
  },

  beforeLeave: function (el) {
    el.textContent = 'beforeLeave'
  },
  leave: function (el) {
    el.textContent = 'leave'
  },
  afterLeave: function (el) {
    el.textContent = 'afterLeave'
  },
  leaveCancelled: function (el) {
    // handle cancellation
  }
})
```

{% raw %}
<div id="demo">
  <div v-if="show" transition="expand">hello</div>
  <button @click="show = !show">Toggle</button>
</div>

<style>
.expand-transition {
  transition: all .3s ease;
  height: 30px;
  padding: 10px;
  background-color: #eee;
  overflow: hidden;
}
.expand-enter, .expand-leave {
  height: 0;
  padding: 0 10px;
  opacity: 0;
}
</style>

<script>
new Uppy({
  el: '#demo',
  data: {
    show: true,
    transitionState: 'Idle'
  },
  transitions: {
    expand: {
      beforeEnter: function (el) {
        el.textContent = 'beforeEnter'
      },
      enter: function (el) {
        el.textContent = 'enter'
      },
      afterEnter: function (el) {
        el.textContent = 'afterEnter'
      },
      beforeLeave: function (el) {
        el.textContent = 'beforeLeave'
      },
      leave: function (el) {
        el.textContent = 'leave'
      },
      afterLeave: function (el) {
        el.textContent = 'afterLeave'
      }
    }
  }
})
</script>
{% endraw %}

### Transition CSS Classes

The classes being added and toggled are based on the value of the `transition` attribute. In the case of `transition="fade"`, three CSS classes are involved:

1. The class `.fade-transition` will be always present on the element.

2. `.fade-enter` defines the starting state of an entering transition. It is applied for a single frame and then immediately removed.

3. `.fade-leave` defines the ending state of a leaving transition. It is applied when the leaving transition starts and removed when the transition finishes.

If the `transition` attribute has no value, the classes will default to `.v-transition`, `.v-enter` and `.v-leave`.

### Transition Flow Details

When the `show` property changes, Uppy.js will insert or remove the `<div>` element accordingly, and apply transition classes as specified below:

- When `show` becomes false, Uppy.js will:
  1. Call `beforeLeave` hook;
  2. Apply `v-leave` class to the element to trigger the transition;
  3. Call `leave` hook;
  4. Wait for the transition to finish; (listening to a `transitionend` event)
  5. Remove the element from the DOM and remove `v-leave` class;
  6. Call `afterLeave` hook.

- When `show` becomes true, Uppy.js will:
  1. Call `beforeEnter` hook;
  2. Apply `v-enter` class to the element;
  3. Insert it into the DOM;
  4. Call `enter` hook;
  5. Force a CSS layout so `v-enter` is actually applied, then remove the `v-enter` class to trigger a transition back to the element's original state;
  6. Wait for the transition to finish;
  7. Call `afterEnter` hook.

In addition, if you remove an element when its enter transition is in progress, the `enterCancelled` hook will be called to give you the opportunity to clean up changes or timers created in `enter`. Vice-versa for leaving transitions.

All of the above hook functions are called with their `this` contexts set to the associated Uppy instances. If the element is the root node of a Uppy instance, that instance will be used as the context. Otherwise, the context will be the owner instance of the transition directive.

Finally, the `enter` and `leave` can optionally take a second callback argument. When you do so, you are indicating that you want to explicitly control when the transition should end, so instead of waiting for the CSS `transitionend` event, Uppy.js will expect you to eventually call the callback to finish the transition. For example:

``` js
enter: function (el) {
  // no second argument, transition end
  // determined by CSS transitionend event
}
```

vs.

``` js
enter: function (el, done) {
  // with the second argument, the transition
  // will only end when `done` is called.
}
```

<p class="tip">When multiple elements are being transitioned together, Uppy.js batches them and only applies one forced layout.</p>

### CSS Animations

CSS animations are applied in the same way with CSS transitions, the difference being that `v-enter` is not removed immediately after the element is inserted, but on an `animationend` event.

Example: (omitting prefixed CSS rules here)

``` html
<span v-show="show" transition="bounce">Look at me!</span>
```

``` css
.bounce-enter {
  animation: bounce-in .5s;
}
.bounce-leave {
  animation: bounce-out .5s;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes bounce-out {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(0);
  }
}
```

{% raw %}
<div id="anim" class="demo">
  <span v-show="show" transition="bounce">Look at me!</span>
  <br>
  <button @click="show = !show">Toggle</button>
</div>

<style>
  .bounce-enter {
    -webkit-animation: bounce-in .5s;
    animation: bounce-in .5s;
  }
  .bounce-leave {
    -webkit-animation: bounce-out .5s;
    animation: bounce-out .5s;
  }
  @keyframes bounce-in {
    0% {
      transform: scale(0);
      -webkit-transform: scale(0);
    }
    50% {
      transform: scale(1.5);
      -webkit-transform: scale(1.5);
    }
    100% {
      transform: scale(1);
      -webkit-transform: scale(1);
    }
  }
  @keyframes bounce-out {
    0% {
      transform: scale(1);
      -webkit-transform: scale(1);
    }
    50% {
      transform: scale(1.5);
      -webkit-transform: scale(1.5);
    }
    100% {
      transform: scale(0);
      -webkit-transform: scale(0);
    }
  }
  @-webkit-keyframes bounce-in {
    0% {
      -webkit-transform: scale(0);
    }
    50% {
      -webkit-transform: scale(1.5);
    }
    100% {
      -webkit-transform: scale(1);
    }
  }
  @-webkit-keyframes bounce-out {
    0% {
      -webkit-transform: scale(1);
    }
    50% {
      -webkit-transform: scale(1.5);
    }
    100% {
      -webkit-transform: scale(0);
    }
  }
</style>

<script>
new Uppy({
  el: '#anim',
  data: { show: true }
})
</script>
{% endraw %}

## JavaScript Transitions

You can also use just the JavaScript hooks without defining any CSS rules. When using JavaScript only transitions, **the `done` callbacks are required for the `enter` and `leave` hooks**, otherwise they will be called synchronously and the transition will finish immediately.

It's also a good idea to explicitly declare `css: false` for your JavaScript transitions so that Uppy.js can skip the CSS detection. This also prevents cascaded CSS rules from accidentally interfering with the transition.

The following example registers a custom JavaScript transition using jQuery:

``` js
Uppy.transition('fade', {
  css: false,
  enter: function (el, done) {
    // element is already inserted into the DOM
    // call done when animation finishes.
    $(el)
      .css('opacity', 0)
      .animate({ opacity: 1 }, 1000, done)
  },
  enterCancelled: function (el) {
    $(el).stop()
  },
  leave: function (el, done) {
    // same as enter
    $(el).animate({ opacity: 0 }, 1000, done)
  },
  leaveCancelled: function (el) {
    $(el).stop()
  }
})
```

Then you can use it with the `transition` attribute, same deal:

``` html
<p transition="fade"></p>
```

## Staggering Transitions

It's possible to create staggering transitions when using `transition` with `v-for`. You can do this either by adding a `stagger`, `enter-stagger` or `leave-stagger` attribute to your transitioned element:

``` html
<div v-for="list" transition stagger="100"></div>
```

Or, you can provide a `stagger`, `enterStagger` or `leaveStagger` hook for finer-grained control:

``` js
Uppy.transition('stagger', {
  stagger: function (index) {
    // increase delay by 50ms for each transitioned item,
    // but limit max delay to 300ms
    return Math.min(300, index * 50)
  }
})
```

Example:

<iframe width="100%" height="200" style="margin-left:10px" src="http://jsfiddle.net/yyx990803/mvo99bse/embedded/result,html,js,css" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
