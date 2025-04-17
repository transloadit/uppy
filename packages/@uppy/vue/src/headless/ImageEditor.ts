import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  ImageEditor as PreactImageEditor,
  type ImageEditorProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<ImageEditorProps>({
  name: 'ImageEditor',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderImageEditor() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactImageEditor, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies ImageEditorProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderImageEditor()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderImageEditor()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
