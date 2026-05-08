class Gauge {
  set = () => {}
}

export default function () {
  type Req = { url?: string }
  type Res = {
    setHeader: (key: string, value: string) => void
    end: (s?: string) => void
  }
  type Next = () => void

  const middleware = (req: Req, res: Res, next: Next) => {
    // simulate prometheus metrics endpoint:
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', 'text/plain')
      res.end('# Dummy metrics\n')
      return
    }
    next()
  }

  middleware.promClient = {
    collectDefaultMetrics: () => {},
    Gauge,
  }

  return middleware
}
