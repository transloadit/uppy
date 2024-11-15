import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { useMemo, useCallback } from 'preact/hooks'
import { useSyncExternalStore } from 'preact/compat'

import type { PluginOpts } from './BasePlugin'
import type BasePlugin from './BasePlugin'
import type { State, Uppy } from './Uppy'

// todo merge with @uppy/react?
export function useUppyState<
  M extends Meta = Meta,
  B extends Body = Body,
  T = any,
>(uppy: Uppy<M, B>, selector: (state: State<M, B>) => T): T {
  const subscribe = useMemo(
    () => uppy.store.subscribe.bind(uppy.store),
    [uppy.store],
  )
  const getSnapshot = useCallback(() => uppy.store.getState(), [uppy.store])

  return selector(useSyncExternalStore(subscribe, getSnapshot))
}

export function useUppyPluginState<
  PS extends Record<string, unknown>,
  O extends PluginOpts,
  M extends Meta = Meta,
  B extends Body = Body,
>(
  plugin: BasePlugin<O, M, B, PS>,
): [Partial<PS>, (...args: Parameters<typeof plugin.setPluginState>) => void] {
  const setPluginState = useCallback<typeof plugin.setPluginState>(
    (...args) => plugin.setPluginState(...args),
    [plugin],
  )
  return [
    useUppyState(
      plugin.uppy,
      (state) => (state.plugins[plugin.id] ?? {}) as PS,
    ),
    setPluginState,
  ]
}
