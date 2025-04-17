import { defineComponent, ref, watch, onMounted, h } from 'vue'
import { Audio as PreactAudio, type AudioProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<AudioProps>({
  name: 'Audio',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderAudio() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactAudio, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies AudioProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderAudio()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderAudio()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
