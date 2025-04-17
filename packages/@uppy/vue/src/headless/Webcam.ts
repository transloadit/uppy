import { defineComponent, ref, watch, onMounted, h } from 'vue'
import { Webcam as PreactWebcam, type WebcamProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<WebcamProps>({
  name: 'Webcam',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderWebcam() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactWebcam, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies WebcamProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderWebcam()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderWebcam()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
