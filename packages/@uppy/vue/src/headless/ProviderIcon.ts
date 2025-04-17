import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  ProviderIcon as PreactProviderIcon,
  type ProviderIconProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<ProviderIconProps>({
  name: 'ProviderIcon',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderProviderIcon() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactProviderIcon, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies ProviderIconProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderProviderIcon()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderProviderIcon()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
