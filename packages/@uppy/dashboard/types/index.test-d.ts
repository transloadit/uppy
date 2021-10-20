import { expectType, expectError } from 'tsd'
import Uppy from '@uppy/core'
import Dashboard from '..'

{
  const uppy = new Uppy()
  uppy.use(Dashboard, {
    target: 'body',
  })

  const plugin = uppy.getPlugin<Dashboard>('Dashboard') ?? ({} as never)
  plugin.openModal()
  expectType<boolean>(plugin.isModalOpen())
  plugin.closeModal()
}

{
  const uppy = new Uppy()
  uppy.use(Dashboard, {
    width: '100%',
    height: 700,
    metaFields: [
      { id: 'caption', name: 'Caption' },
      {
        id: 'license',
        name: 'License',
        placeholder: 'Creative Commons, Apache 2.0, ...',
      },
      {
        id: 'public',
        name: 'Public',
        render ({ value, onChange }, h) {
          expectType<string>(value)
          expectType<(val: string) => void>(onChange)
          // `h` should be the Preact `h`
          expectError(h([], 'error'))
          /* Currently `h` typings are limited because of a JSX type conflict between React and Preact.
          return h('input', {
            type: 'checkbox',
            checked: value === 'yes',
            onChange: (event) => {
              expectType<Event>(event)
              onChange((event.target as HTMLInputElement).checked ? 'yes' : 'no')
            }
          })
          */
        },
      },
    ],
    onDragOver: (event) => event.clientX,
    onDrop: (event) => event.clientX,
    onDragLeave: (event) => event.clientX,
  })

  uppy.on('dashboard:file-edit-state', (file) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileName = file.name
  })
}

{
  const uppy = new Uppy()
  uppy.use(Dashboard, {
    locale: {
      strings: {
        // Dashboard string
        addMoreFiles: 'yaddayadda',
        // StatusBar string
        uploading: '^^^^',
      },
    },
  })
  expectError(uppy.use(Dashboard, {
    locale: {
      strings: {
        somethingThatDoesNotExist: 'wrong',
      },
    },
  }))
  const wrongType = 1234
  expectError(uppy.use(Dashboard, {
    locale: {
      strings: {
        addMoreFiles: wrongType,
      },
    },
  }))
}
{
  const uppy = new Uppy()
  expectError(uppy.use(Dashboard, { height: {} }))
}
