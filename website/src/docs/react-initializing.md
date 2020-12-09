---
title: "Initializing Uppy"
type: docs
module: "@uppy/react"
permalink: docs/react/initializing/
alias: docs/react/initializing/
order: 1
category: "React"
---

When using Uppy's React components, an Uppy instance must be passed in to the `uppy={}` prop from the outside. This Uppy instance must be initialized before passing it to the desired component, and be cleaned up using `uppy.close()` when you are done with it.

## Functional Components

With React Hooks, the `useRef` hook can be used to create an instance once and remember it for all rerenders. The `useEffect` hook can close the Uppy instance when the component unmounts.

```js
function MyComponent () {
  const uppy = useRef(undefined);
  // Make sure we only initialize it the first time:
  if (uppy.current === undefined) {
    uppy.current = new Uppy()
      .use(Transloadit, {})
  }

  React.useEffect(() => {
    // Return a cleanup function:
    return () => uppy.current.close()
  }, [])

  return <DashboardModal uppy={uppy} />
}
```

With `useRef`, the Uppy instance and its functions are stored on the `.current` property.
`useEffect()` must receive the `[]` dependency array parameter, or the Uppy instance will be destroyed every time the component rerenders.
To make sure you never forget these requirements, you could wrap it up in a custom hook:

```js
function useUppy (factory) {
  const uppy = React.useRef(undefined)
  // Make sure we only initialize it the first time:
  if (uppy.current === undefined) {
    uppy.current = factory()
  }

  React.useEffect(() => {
    return () => uppy.current.close()
  }, [])
  return uppy.current
}

// Then use it as:
const uppy = useUppy(() =>
  new Uppy()
    .use(Tus, {})
)
```

(The function wrapper is required here so you don't create an unused Uppy instance on each rerender.)

## Class Components

A simple approach is to create an Uppy instance in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.uppy = Uppy()
      .use(Transloadit, {})
  }

  componentWillUnmount () {
    this.uppy.close()
  }

  render () {
    return <DashboardModal uppy={this.uppy} />
  }
}
```
