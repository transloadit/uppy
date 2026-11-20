import type { RouteConfig } from '@react-router/dev/routes'

import { index, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('api/upload/xhr', 'routes/upload/route.ts'),
  route('api/transloadit-params', 'routes/transloadit-params/route.ts'),
] satisfies RouteConfig
