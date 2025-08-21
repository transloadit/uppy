class Gauge {
  set = () => {}
}

export default function () {
  const middleware = (req, res, next) => {
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
