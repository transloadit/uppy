---
title: "Initializing Uppy"
type: docs
module: "@uppy/react"
permalink: docs/react/initializing/
alias: docs/react/initializing/
order: 1
category: "React"
---

Your Uppy instance must be initialized before passing it to an `uppy={}` prop in the desired component,
and should be cleaned up using `uppy.close()` when you are done with it.

## Class Components

A simple approach is to initialize it in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

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

## Functional Components

With react hooks, writing pure functional components are on hype. For wealthy initializing Uppy in a functional component, we need to use the `useRef` hook for keeping the same instance across multiple renders and use `useEffect` for cleaning up things when the component is unmounted.

```js
const MyComponent = () => {
  const uppy = useRef(Uppy().use(Transloadit, {}));

  useEffect(() => {
    return () => uppy.current.close()
  }, [])

  return <DashboardModal uppy={uppy.current} />
}
```

Credits for functional components approach: https://stackoverflow.com/questions/56392794/react-hooks-how-to-write-variables-in-functional-components-that-in-class-compo
