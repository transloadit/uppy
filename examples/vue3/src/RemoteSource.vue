<template>
  <div
    v-if="!remoteSource.state.authenticated"
    class="p-4 pt-0 min-w-xl min-h-96"
  >
    <button
      type="button"
      class="block ml-auto text-blue-500"
      @click="() => remoteSource.login()"
    >
      Login
    </button>
  </div>

  <div
    v-else
    class="w-screen h-screen max-w-3xl max-h-96 relative flex flex-col"
  >
    <div
      class="flex justify-between items-center gap-2 bg-gray-100 pb-2 px-4 py-2"
    >
      <template
        v-for="(breadcrumb, index) in remoteSource.state.breadcrumbs"
        :key="breadcrumb.id"
      >
        <span v-if="index > 0" class="text-gray-500">&gt;</span>
        <span v-if="index === remoteSource.state.breadcrumbs.length - 1">
          {{ breadcrumb.type === 'root' ? props.id : breadcrumb.data.name }}
        </span>
        <button
          v-else
          type="button"
          class="text-blue-500"
          @click="() => remoteSource.open(breadcrumb.id)"
        >
          {{ breadcrumb.type === 'root' ? props.id : breadcrumb.data.name }}
        </button>
      </template>
      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          class="text-blue-500"
          @click="
            () => {
              remoteSource.logout()
              props.close()
            }
          "
        >
          Logout
        </button>
      </div>
    </div>

    <ul class="p-4 flex-1 overflow-y-auto">
      <p v-if="remoteSource.state.loading">loading...</p>
      <template
        v-else
        v-for="item in remoteSource.state.partialTree"
        :key="item.id"
      >
        <!-- File Item -->
        <li v-if="item.type === 'file'" class="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            @change="() => remoteSource.checkbox(item, false)"
            :checked="item.status === 'checked'"
          />
          <img
            v-if="item.data.thumbnail"
            :src="item.data.thumbnail"
            alt=""
            class="w-5 h-5"
          />
          <div class="truncate">{{ item.data.name }}</div>
          <p class="text-gray-500 text-sm ml-auto min-w-28 text-right">
            {{ dtf.format(new Date(item.data.modifiedDate)) }}
          </p>
        </li>

        <!-- Folder Item -->
        <li
          v-else-if="item.type === 'folder'"
          class="flex items-center gap-2 mb-2"
        >
          <input
            type="checkbox"
            :ref="(el) => setIndeterminate(el as HTMLInputElement, item)"
            @change="() => remoteSource.checkbox(item, false)"
            :checked="item.status === 'checked'"
          />
          <button
            type="button"
            class="text-blue-500"
            @click="() => remoteSource.open(item.id)"
          >
            <span aria-hidden class="w-5 h-5">📁</span>
            {{ item.data.name }}
          </button>
        </li>
      </template>
    </ul>

    <div
      v-if="remoteSource.state.selectedAmount > 0"
      class="flex items-center gap-4 bg-gray-100 py-2 px-4 absolute bottom-0 left-0 right-0"
    >
      <button
        type="button"
        class="text-blue-500"
        @click="
          () => {
            remoteSource.done()
            props.close()
          }
        "
      >
        Done
      </button>
      <button
        type="button"
        class="text-blue-500"
        @click="() => remoteSource.cancel()"
      >
        Cancel
      </button>
      <p class="text-gray-500 text-sm">
        Selected {{ remoteSource.state.selectedAmount }} items
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRemoteSource } from '@uppy/vue'
import type { AvailablePluginsKeys } from '@uppy/remote-sources'
import { PartialTreeFolderNode } from '@uppy/core'

const props = defineProps<{
  close: () => void
  id: AvailablePluginsKeys
}>()

const remoteSource = useRemoteSource(props.id)
const dtf = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
})
const setIndeterminate = (
  el: HTMLInputElement | null,
  item: PartialTreeFolderNode,
) => {
  if (el && item.status === 'partial') {
    el.indeterminate = true
  }
}
</script>
