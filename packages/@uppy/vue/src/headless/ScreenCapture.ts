import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  ScreenCapture as PreactScreenCapture,
  type ScreenCaptureProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<ScreenCaptureProps>({
  name: 'ScreenCapture',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderScreenCapture() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactScreenCapture, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies ScreenCaptureProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderScreenCapture()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderScreenCapture()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
