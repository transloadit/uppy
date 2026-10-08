// TODO remove this when we can use TypeScript 7.1 content mappers.
declare module '*.vue' {
  import type { Component } from 'vue'

  const component: Component
  export default component
}
