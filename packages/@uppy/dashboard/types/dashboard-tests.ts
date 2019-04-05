import Uppy = require('@uppy/core')
import Dashboard = require('../')

{
  const uppy = Uppy()
  uppy.use(Dashboard, {
    target: 'body'
  })

  const plugin = uppy.getPlugin('Dashboard') as Dashboard
  plugin.openModal()
  plugin.isModalOpen() // $ExpectType boolean
  plugin.closeModal()
}

{
  const uppy = Uppy()
  uppy.use(Dashboard, {
    width: '100%',
    height: 700
  })
}

{
  const uppy = Uppy()
  // $ExpectError
  uppy.use(Dashboard, { height: {} })
}
