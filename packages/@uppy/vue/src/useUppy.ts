import type { UnknownPlugin, Uppy } from '@uppy/core'
import { shallowEqualObjects } from 'shallow-equal'
import { onBeforeUnmount, onMounted, type Ref, watch } from 'vue'

export default function useUppy<P extends UnknownPlugin<any, any>>(
  installPlugin: () => void,
  plugin: Ref<P | undefined>,
  uppy: Uppy<any, any>,
  props: Ref<Record<string, unknown> | undefined>,
): void {
  onMounted(() => {
    installPlugin()
  })

  onBeforeUnmount(() => {
    uppy.removePlugin(plugin.value!)
  })

  watch(
    () => props.value,
    (current, old) => {
      if (!shallowEqualObjects(current, old)) {
        plugin.value!.setOptions({ ...current })
      }
    },
  )
}
