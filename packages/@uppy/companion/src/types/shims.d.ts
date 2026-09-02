declare module 'express-interceptor' {
  import type { Request, RequestHandler, Response } from 'express'

  type InterceptorConfig = {
    isInterceptable: () => boolean
    intercept: (body: unknown, send: (body: unknown) => void) => void
  }

  export default function interceptor(
    fn: (req: Request, res: Response) => InterceptorConfig,
  ): RequestHandler
}
