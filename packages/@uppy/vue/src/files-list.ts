import { defineComponent, ref, watch, onMounted, h, type PropType } from 'vue'
import {
  FilesList as PreactFilesList
} from '@uppy/components'
import { h as preactH  } from 'preact'
import { render as preactRender } from 'preact/compat'
import type { UppyFile, Meta, Body } from '@uppy/core'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent({
  name: 'FilesList',
  props: {
    editFile: {
      type: Function as PropType<(file: UppyFile<Meta, Body>) => void>,
      default: undefined
    },
    item: {
      type: Function as PropType<(file: UppyFile<Meta, Body>) => any>,
      default: undefined
    }
  },
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    console.log(ctx)

    function renderFilesList() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactFilesList, {
            editFile: props.editFile,
            item: props.item,
            ctx,
            render: vueRender
          }),
          containerRef.value
        )
      }
    }

    onMounted(() => {
      renderFilesList()
    })

    watch(
      () => [props.editFile, props.item],
      () => {
        renderFilesList()
      }
    )

    return () => h('div', { ref: containerRef })
  }
})
