import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('upload', 'routes/upload/route.ts'),
  route('transloadit-params', 'routes/transloadit-params/route.ts'),
] satisfies RouteConfig
