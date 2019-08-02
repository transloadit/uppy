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
  uppy.use(Dashboard, <Partial<Dashboard.DashboardOptions>>{
    width: '100%',
    height: 700,
    metaFields: [
      { id: 'caption', name: 'Caption' },
      { id: 'license', name: 'License', placeholder: 'Creative Commons, Apache 2.0, ...' },
    ]
  })
}

{
  const uppy = Uppy()
  // $ExpectError
  uppy.use(Dashboard, { height: {} })
}
