import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  GoogleDrivePicker as PreactGoogleDrivePicker,
  type GoogleDrivePickerProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<GoogleDrivePickerProps>({
  name: 'GoogleDrivePicker',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderGoogleDrivePicker() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactGoogleDrivePicker, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies GoogleDrivePickerProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderGoogleDrivePicker()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderGoogleDrivePicker()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
