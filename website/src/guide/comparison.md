---
title: Comparison with Other Frameworks
type: guide
order: 19
---

## Angular

There are a few reasons to use Uppy over Angular, although they might not apply for everyone:

- Uppy.js is much simpler than Angular, both in terms of API and design. You can learn almost everything about it really fast and get productive.

- Uppy.js is a more flexible, less opinionated solution. That allows you to structure your app the way you want it to be, instead of being forced to do everything the Angular way. It's only an interface layer so you can use it as a light feature in pages instead of a full blown SPA. It gives you bigger room to mix and match with other libraries, but you are also responsible for making more architectural decisions. For example, Uppy.js' core doesn't come with routing or ajax functionalities by default, and usually assumes you are building the application using an external module bundler. This is probably the most important distinction.

- Uppy.js has better performance and is much, much easier to optimize, because it doesn't use dirty checking. Angular gets slow when there are a lot of watchers, because every time anything in the scope changes, all these watchers need to be re-evaluated again. Also, the digest cycle may have to run multiple times to "stabilize" if some watcher triggers another update. Angular users often have to resort to esoteric techniques to get around the digest cycle, and in some situations there's simply no way to optimize a scope with a large amount of watchers. Uppy.js doesn't suffer from this at all because it uses a transparent dependency-tracking observing system with async queueing - all changes trigger independently unless they have explicit dependency relationships. The only optimization hint you'll ever need is the `track-by` param on `v-for` lists.

- Uppy.js has a clearer separation between directives and components. Directives are meant to encapsulate DOM manipulations only, while Components stand for a self-contained unit that has its own view and data logic. In Angular there's a lot of confusion between the two.

Interestingly, quite a few Angular 1 issues that are non-existent in Uppy are also addressed by the design decisions in Angular 2.

## React

React and Uppy.js do share a similarity in that they both provide reactive & composable View components. There are, of course, many differences as well.

First, the internal implementation is fundamentally different. React's rendering leverages the Virtual DOM - an in-memory representation of what the actual DOM should look like. When the state changes, React does a full re-render of the Virtual DOM, diffs it, and then patches the real DOM.

The virtual-DOM approach provides a functional way to describe your view at any point of time, which is really nice. Because it doesn't use observables and re-renders the entire app on every update, the view is by definition guaranteed to be in sync with the data. It also opens up possibilities to isomorphic JavaScript applications.

Instead of a Virtual DOM, Uppy.js uses the actual DOM as the template and keeps references to actual nodes for data bindings. This limits Uppy.js to environments where DOM is present. However, contrary to the common misconception that Virtual-DOM makes React faster than anything else, Uppy.js actually out-performs React when it comes to hot updates, and requires almost no hand-tuned optimization. With React, you need to implement `shouldComponentUpdate` everywhere or use immutable data structures to achieve fully optimized re-renders.

API-wise, one issue with React (or JSX) is that the render function often involves a lot of logic, and ends up looking more like a piece of program (which in fact it is) rather than a visual representation of the interface. For some developers this is a bonus, but for designer/developer hybrids like me, having a template makes it much easier to think visually about the design and CSS. JSX mixed with JavaScript logic breaks that visual model I need to map the code to the design. In contrast, Uppy.js pays the cost of a lightweight data-binding DSL so that we have a visually scannable template and with logic encapsulated into directives and filters.

Another issue with React is that because DOM updates are completely delegated to the Virtual DOM, it's a bit tricky when you actually **want** to control the DOM yourself (although theoretically you can, you'd be essentially working against the library when you do that). For applications that needs ad-hoc custom DOM manipulations, especially animations with complex timing requirements, this can become a pretty annoying restriction. On this front, Uppy.js allows for more flexibility and there are [multiple FWA/Awwwards winning sites](https://github.com/transloadit/uppy/wiki/Projects-Using-Uppy.js#interactive-experiences) built with Uppy.js.

Some additional notes:

- The React team has very ambitious goals in making React a platform-agnostic UI development paradigm, while Uppy is focused on providing a pragmatic solution for the web.

- React, due to its functional nature, plays very well with functional programming patterns. However it also introduces a higher learning barrier for junior developers and beginners. Uppy is much easier to pick up and get productive with in this regard.

- For large applications, the React community has been doing a lot of innovation in terms of state management solutions, e.g. Flux/Redux. Uppy itself doesn't really address that problem (same for React core), but the state management patterns can be easily adopted for a similar architecture. I've seen users use Redux with Uppy, and engineers at Optimizely have been using NuclearJS (their Flux dialect) with Uppy as well.

- The trend in React development is pushing you to put everything in JavaScript, including your CSS. There has been many CSS-in-JS solutions out there but all more or less have its own problems. And most importantly, it deviates from the standard CSS authoring experience and makes it very awkward to leverage existing work in the CSS community. Uppy's [single file components](http://uppyjs.io/guide/application.html#Single_File_Components) gives you component-encapsulated CSS while still allowing you to use your pre-processors of choice.

## Ember

Ember is a full-featured framework that is designed to be highly opinionated. It provides a lot of established conventions, and once you are familiar enough with them, it can make you very productive. However, it also means the learning curve is high and the flexibility suffers. It's a trade-off when you try to pick between an opinionated framework and a library with a loosely coupled set of tools that work together. The latter gives you more freedom but also requires you to make more architectural decisions.

That said, it would probably make a better comparison between Uppy.js core and Ember's templating and object model layer:

- Uppy provides unobtrusive reactivity on plain JavaScript objects, and fully automatic computed properties. In Ember you need to wrap everything in Ember Objects and manually declare dependencies for computed properties.

- Uppy's template syntax harnesses the full power of JavaScript expressions, while Handlebars' expression and helper syntax is quite limited in comparison.

- Performance wise, Uppy outperforms Ember by a fair margin, even after the latest Glimmer engine update in Ember 2.0. Uppy automatically batches updates, while in Ember you need to manually manage run loops in performance-critical situations.

## Polymer

Polymer is yet another Google-sponsored project and in fact was a source of inspiration for Uppy.js as well. Uppy.js' components can be loosely compared to Polymer's custom elements, and both provide a very similar development style. The biggest difference is that Polymer is built upon the latest Web Components features, and requires non-trivial polyfills to work (with degraded performance) in browsers that don't support those features natively. In contrast, Uppy.js works without any dependencies down to IE9.

Also, in Polymer 1.0 the team has really made its data-binding system very limited in order to compensate for the performance. For example, the only expressions supported in Polymer templates are the boolean negation and single method calls. Its computed property implementation is also not very flexible.

Finally, when deploying to production, Polymer elements need to be bundled via a Polymer-specific tool called vulcanizer. In comparison, single file Uppy components can leverage everything the Webpack ecosystem has to offer, and thus you can easily use ES6 and any CSS pre-processors you want in your Uppy components.

## Riot

Riot 2.0 provides a similar component-based development model (which is called a "tag" in Riot), with a minimal and beautifully designed API. I think Riot and Uppy share a lot in design philosophies. However, despite being a bit heavier than Riot, Uppy does offer some significant advantages over Riot:

- True conditional rendering (Riot renders all if branches and simply show/hide them)
- A far-more powerful router (Riot’s routing API is just way too minimal)
- More mature tooling support (see webpack + uppy-loader)
- Transition effect system (Riot has none)
- Better performance. (Riot in fact uses dirty checking rather than a virtual-dom, and thus suffers from the same performance issues with Angular.)
