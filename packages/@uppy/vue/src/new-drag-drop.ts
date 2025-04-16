import { defineComponent, ref, watch, onMounted, h, type PropType } from 'vue'
import {
  DragDrop as PreactDragDrop,
  type DragDropProps
} from '@uppy/components'
import { h as preactH  } from 'preact'
import { render as preactRender } from 'preact/compat'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent({
  name: 'DragDrop',
  props: {
    width: {
      type: String,
      default: undefined
    },
    height: {
      type: String,
      default: undefined
    },
    note: {
      type: String,
      default: undefined
    },
    noClick: {
      type: Boolean,
      default: false
    },
    child: {
      type: Function as PropType<() => any>,
      default: undefined
    }
  },
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()


    function renderDragDrop() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactDragDrop, {
            width: props.width,
            height: props.height,
            note: props.note,
            noClick: props.noClick,
            child: props.child,
            ctx,
            render: vueRender
          } satisfies DragDropProps),
          containerRef.value
        )
      }
    }

    onMounted(() => {
      renderDragDrop()
    })

    watch(
      () => [props.width, props.height, props.note, props.noClick, props.child],
      () => {
        renderDragDrop()
      }
    )

    return () => h('div', { ref: containerRef })
  }
})
