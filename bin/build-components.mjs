#!/usr/bin/env node

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory of this script
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')

// Define paths
const COMPONENTS_DIR = path.join(rootDir, 'packages/@uppy/components/src')
const REACT_DIR = path.join(rootDir, 'packages/@uppy/react/src/headless')
const VUE_DIR = path.join(rootDir, 'packages/@uppy/vue/src/headless')
const SVELTE_DIR = path.join(
  rootDir,
  'packages/@uppy/svelte/src/lib/components/headless',
)

// Templates
const REACT_TEMPLATE = `import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  %%ComponentName%% as %%PreactComponentName%%,
  type %%PropsTypeName%%,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function %%ComponentName%%(props: Omit<%%PropsTypeName%%, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(%%PreactComponentName%%, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies %%PropsTypeName%%),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
`

const VUE_TEMPLATE = `import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  %%ComponentName%% as %%PreactComponentName%%,
  type %%PropsTypeName%%,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<%%PropsTypeName%%>({
  name: '%%ComponentName%%',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function render%%ComponentName%%() {
      if (containerRef.value) {
        preactRender(
          preactH(%%PreactComponentName%%, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies %%PropsTypeName%%),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      render%%ComponentName%%()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          render%%ComponentName%%()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
`

const SVELTE_TEMPLATE = `<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    %%ComponentName%% as %%PreactComponentName%%,
    type %%PropsTypeName%%,
    type UppyContext,
  } from '@uppy/components'
  import { h as preactH } from 'preact'
  import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<%%PropsTypeName%%, 'ctx' | 'render'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(%%PreactComponentName%%, {
          ...props,
          ctx,
          render: (el: Element | null, node: any) => {
            if (el) {
              mount(node, { target: el })
            }
          },
        } satisfies %%PropsTypeName%%),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
`

// Helper function to convert kebab-case to PascalCase
function kebabToPascal(kebabCase) {
  return kebabCase
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

try {
  // Check if components directory exists
  await fs.access(COMPONENTS_DIR).catch(() => {
    throw new Error(`Components directory not found: ${COMPONENTS_DIR}`)
  })
  await Promise.all(
    [REACT_DIR, VUE_DIR, SVELTE_DIR].map(async (dir) => {
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true })
      }
    }),
  )

  // Read all files in components directory
  const files = await fs.readdir(COMPONENTS_DIR)

  // Filter for .tsx files
  const tsxFiles = files.filter((file) => file.endsWith('.tsx'))

  console.log(`Found ${tsxFiles.length} Preact component(s) to process\n`)

  // Track generated components for index files
  const reactComponents = []
  const vueComponents = []
  const svelteComponents = []

  // Process each tsx file
  for (const file of tsxFiles) {
    try {
      const baseName = path.basename(file, '.tsx')
      const componentName = kebabToPascal(baseName)
      const propsTypeName = `${componentName}Props`
      const preactComponentName = `Preact${componentName}`

      // Generate React wrapper
      const reactContent = REACT_TEMPLATE.replace(
        /%%ComponentName%%/g,
        componentName,
      )
        .replace(/%%PreactComponentName%%/g, preactComponentName)
        .replace(/%%PropsTypeName%%/g, propsTypeName)

      // Generate Vue wrapper
      const vueContent = VUE_TEMPLATE.replace(
        /%%ComponentName%%/g,
        componentName,
      )
        .replace(/%%PreactComponentName%%/g, preactComponentName)
        .replace(/%%PropsTypeName%%/g, propsTypeName)

      // Generate Svelte wrapper
      const svelteContent = SVELTE_TEMPLATE.replace(
        /%%ComponentName%%/g,
        componentName,
      )
        .replace(/%%PreactComponentName%%/g, preactComponentName)
        .replace(/%%PropsTypeName%%/g, propsTypeName)

      // Write files
      const reactFilePath = path.join(REACT_DIR, `${componentName}.tsx`)
      const vueFilePath = path.join(VUE_DIR, `${componentName}.ts`)
      const svelteFilePath = path.join(SVELTE_DIR, `${componentName}.svelte`)

      await fs.writeFile(reactFilePath, reactContent)
      await fs.writeFile(vueFilePath, vueContent)
      await fs.writeFile(svelteFilePath, svelteContent)

      // Add to component lists for index files
      reactComponents.push(componentName)
      vueComponents.push(componentName)
      svelteComponents.push(componentName)

      console.log(`✔︎ ${componentName}`)
    } catch (error) {
      console.error(`Error processing component ${file}:`, error)
    }
  }

  // Generate index files
  if (reactComponents.length > 0) {
    const reactIndexContent = reactComponents
      .map((name) => `export { default as ${name} } from './${name}.js'`)
      .join('\n')
    await fs.writeFile(path.join(REACT_DIR, 'index.ts'), reactIndexContent)
    console.log(`\nExporting React components from ${REACT_DIR}`)
  }

  if (vueComponents.length > 0) {
    const vueIndexContent = vueComponents
      .map((name) => `export { default as ${name} } from './${name}.js'`)
      .join('\n')
    await fs.writeFile(path.join(VUE_DIR, 'index.ts'), vueIndexContent)
    console.log(`Exporting Vue components from ${VUE_DIR}`)
  }

  if (svelteComponents.length > 0) {
    const svelteIndexContent = svelteComponents
      .map((name) => `export { default as ${name} } from './${name}.svelte'`)
      .join('\n')
    await fs.writeFile(path.join(SVELTE_DIR, 'index.ts'), svelteIndexContent)
    console.log(`Exporting Svelte components from ${SVELTE_DIR}`)
  }

  console.log('\nAll wrappers and index files generated successfully!')
} catch (error) {
  console.error('Error generating wrappers:', error)
  process.exit(1)
}
