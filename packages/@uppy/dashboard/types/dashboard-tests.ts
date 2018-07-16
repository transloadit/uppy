import Uppy from '@uppy/core';
import Dashboard from '../';

{
  const uppy = Uppy()
  uppy.use(Dashboard, {
    target: 'body'
  })

  const plugin = <Dashboard>uppy.getPlugin('Dashboard')
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
