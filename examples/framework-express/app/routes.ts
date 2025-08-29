import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('upload', 'routes/upload/route.ts'),
] satisfies RouteConfig
