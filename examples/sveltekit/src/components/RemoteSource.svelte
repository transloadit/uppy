<script lang="ts">
import type { PartialTreeFolderNode } from '@uppy/core'
import type { AvailablePluginsKeys } from '@uppy/remote-sources'
import { useRemoteSource } from '@uppy/svelte'

interface Props {
  close: () => void
  id: AvailablePluginsKeys
}

const { close, id }: Props = $props()

// Use the value directly, destructuring looses reactivity
const remoteSource = useRemoteSource(id)

const dtf = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function setFolderCheckboxIndeterminate(
  node: HTMLInputElement,
  item: PartialTreeFolderNode,
) {
  if (item.status === 'partial') {
    // Can only be set via JS
    node.indeterminate = true
  }
}
</script>

{#if !remoteSource.state.authenticated}
  <div class="p-4 pt-0 min-w-xl min-h-96">
    <button
      type="button"
      class="block ml-auto text-blue-500"
      onclick={() => remoteSource.login()}
    >
      Login
    </button>
  </div>
{:else}
  <div class="w-screen h-screen max-w-3xl max-h-96 relative flex flex-col">
    <div
      class="flex justify-between items-center gap-2 bg-gray-100 pb-2 px-4 py-2"
    >
      {#each remoteSource.state.breadcrumbs as breadcrumb, index (breadcrumb.id)}
        {#if index > 0}
          <span class="text-gray-500">&gt;</span>
        {/if}
        {#if index === remoteSource.state.breadcrumbs.length - 1}
          <span>
            {breadcrumb.type === 'root' ? id : breadcrumb.data.name}
          </span>
        {:else}
          <button
            type="button"
            class="text-blue-500"
            onclick={() => remoteSource.open(breadcrumb.id)}
          >
            {breadcrumb.type === 'root' ? id : breadcrumb.data.name}
          </button>
        {/if}
      {/each}
      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          class="text-blue-500"
          onclick={() => {
            remoteSource.logout()
            close()
          }}
        >
          Logout
        </button>
      </div>
    </div>

    <ul class="p-4 flex-1 overflow-y-auto">
      {#if remoteSource.state.loading}
        <p>loading...</p>
      {:else}
        {#each remoteSource.state.partialTree as item (item.id)}
          {#if item.type === 'file'}
            <!-- File Item -->
            <li class="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                onchange={() => remoteSource.checkbox(item, false)}
                checked={item.status === 'checked'}
              />
              {#if item.data.thumbnail}
                <img src={item.data.thumbnail} alt="" class="w-5 h-5" />
              {/if}
              <div class="truncate">{item.data.name}</div>
              <p class="text-gray-500 text-sm ml-auto min-w-28 text-right">
                {dtf.format(new Date(item.data.modifiedDate))}
              </p>
            </li>
          {:else if item.type === 'folder'}
            <!-- Folder Item -->
            <li class="flex items-center gap-2 mb-2">
              <input
                use:setFolderCheckboxIndeterminate={item}
                type="checkbox"
                onchange={() => remoteSource.checkbox(item, false)}
                checked={item.status === 'checked'}
              />
              <button
                type="button"
                class="text-blue-500"
                onclick={() => remoteSource.open(item.id)}
              >
                <span aria-hidden="true" class="w-5 h-5">📁</span>
                {item.data.name}
              </button>
            </li>
          {/if}
        {/each}
      {/if}
    </ul>

    {#if remoteSource.state.selectedAmount > 0}
      <div
        class="flex items-center gap-4 bg-gray-100 py-2 px-4 absolute bottom-0 left-0 right-0"
      >
        <button
          type="button"
          class="text-blue-500"
          onclick={() => {
            remoteSource.done()
            close()
          }}
        >
          Done
        </button>
        <button
          type="button"
          class="text-blue-500"
          onclick={() => remoteSource.cancel()}
        >
          Cancel
        </button>
        <p class="text-gray-500 text-sm">
          Selected {remoteSource.state.selectedAmount} items
        </p>
      </div>
    {/if}
  </div>
{/if}
