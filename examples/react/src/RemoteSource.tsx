/* eslint-disable no-shadow */
/* eslint-disable react/react-in-jsx-scope */
import { type PartialTreeFile, PartialTreeFolderNode } from '@uppy/core'
import { useRemoteSource } from '@uppy/react'
import type { AvailablePluginsKeys } from '@uppy/remote-sources'
import { useEffect, useRef } from 'react'

const dtf = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function File({
  item,
  checkbox,
}: {
  item: PartialTreeFile
  checkbox: (item: PartialTreeFile, checked: boolean) => void
}) {
  return (
    <li key={item.id} className="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        onChange={() => checkbox(item, false)}
        checked={item.status === 'checked'}
      />
      {item.data.thumbnail && (
        <img src={item.data.thumbnail} alt="" className="w-5 h-5" />
      )}
      <div className="truncate">{item.data.name}</div>
      <p className="text-gray-500 text-sm ml-auto min-w-28 text-right">
        {dtf.format(new Date(item.data.modifiedDate))}
      </p>
    </li>
  )
}
function Folder({
  item,
  checkbox,
  open,
}: {
  item: PartialTreeFolderNode
  checkbox: (item: PartialTreeFolderNode, checked: boolean) => void
  open: (folderId: string | null) => Promise<void>
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current && item.status === 'partial') {
      // Can only be set via JS
      ref.current.indeterminate = true
    }
  }, [item.status])

  return (
    <li key={item.id} className="flex items-center gap-2 mb-2">
      <input
        ref={ref}
        type="checkbox"
        onChange={() => checkbox(item, false)}
        checked={item.status === 'checked'}
      />
      <button
        type="button"
        className="text-blue-500"
        onClick={() => open(item.id)}
      >
        <span aria-hidden className="w-5 h-5">
          📁
        </span>{' '}
        {item.data.name}
      </button>
    </li>
  )
}

export function RemoteSource({
  close,
  id,
}: {
  close: () => void
  id: AvailablePluginsKeys
}) {
  const { state, login, logout, checkbox, open, done, cancel } =
    useRemoteSource(id)

  if (!state.authenticated) {
    return (
      <div className="p-4 pt-0 min-w-xl min-h-96">
        <button
          type="button"
          className="block ml-auto text-blue-500"
          onClick={() => login()}
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen max-w-3xl max-h-96 relative flex flex-col">
      <div className="flex justify-between items-center gap-2 bg-gray-100 pb-2 px-4 py-2">
        {state.breadcrumbs.map((breadcrumb, index) => (
          <>
            {index > 0 && <span className="text-gray-500">&gt;</span>}{' '}
            {index === state.breadcrumbs.length - 1 ?
              <span>
                {breadcrumb.type === 'root' ? 'Dropbox' : breadcrumb.data.name}
              </span>
            : <button
                type="button"
                className="text-blue-500"
                key={breadcrumb.id}
                onClick={() => open(breadcrumb.id)}
              >
                {breadcrumb.type === 'root' ? 'Dropbox' : breadcrumb.data.name}
              </button>
            }
          </>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="text-blue-500"
            onClick={() => {
              logout()
              close()
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <ul className="p-4 flex-1 overflow-y-auto">
        {state.loading ?
          <p>loading...</p>
        : state.partialTree.map((item) => {
            if (item.type === 'file') {
              return <File key={item.id} item={item} checkbox={checkbox} />
            }
            if (item.type === 'folder') {
              return (
                <Folder
                  key={item.id}
                  item={item}
                  checkbox={checkbox}
                  open={open}
                />
              )
            }
            return null
          })
        }
      </ul>

      {state.selectedAmount > 0 && (
        <div className="flex items-center gap-4 bg-gray-100 py-2 px-4 absolute bottom-0 left-0 right-0">
          <button
            type="button"
            className="text-blue-500"
            onClick={() => {
              done()
              close()
            }}
          >
            Done
          </button>
          <button
            type="button"
            className="text-blue-500"
            onClick={() => {
              cancel()
            }}
          >
            Cancel
          </button>
          <p className="text-gray-500 text-sm">
            Selected {state.selectedAmount} items
          </p>
        </div>
      )}
    </div>
  )
}
