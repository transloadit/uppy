declare module 'express-interceptor' {
  import type { Request, Response, RequestHandler } from 'express'

  type InterceptorConfig = {
    isInterceptable: () => boolean
    intercept: (body: unknown, send: (body: unknown) => void) => void
  }

  export default function interceptor(
    fn: (req: Request, res: Response) => InterceptorConfig,
  ): RequestHandler
}

declare module 'supports-color' {
  type ColorSupport = {
    level: number
    hasBasic: boolean
    has256: boolean
    has16m: boolean
  }

  const supportsColor: {
    stdout: ColorSupport | false
    stderr: ColorSupport | false
  }

  export default supportsColor
}
