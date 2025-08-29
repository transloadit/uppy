import type { RenderToReadableStreamOptions } from 'react-dom/server'
import { renderToReadableStream } from 'react-dom/server'
import { ServerRouter } from 'react-router'

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: any
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error)
        responseStatusCode = 500
      },
    } as RenderToReadableStreamOptions
  )

  if (request.signal.aborted) {
    body.cancel()
  }

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
