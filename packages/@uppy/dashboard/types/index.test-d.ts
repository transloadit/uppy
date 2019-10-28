import { expectType, expectError } from 'tsd'
import Uppy = require('@uppy/core')
import Dashboard = require('../')

{
  const uppy = Uppy()
  uppy.use(Dashboard, {
    target: 'body'
  })

  const plugin = uppy.getPlugin('Dashboard') as Dashboard
  plugin.openModal()
  expectType<boolean>(plugin.isModalOpen())
  plugin.closeModal()
}

{
  const uppy = Uppy()
  uppy.use(Dashboard, {
    width: '100%',
    height: 700,
    metaFields: [
      { id: 'caption', name: 'Caption' },
      {
        id: 'license',
        name: 'License',
        placeholder: 'Creative Commons, Apache 2.0, ...'
      }
    ]
  })
}

{
  const uppy = Uppy()
  expectError(uppy.use(Dashboard, { height: {} }))
}
