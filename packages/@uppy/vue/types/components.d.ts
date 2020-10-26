import Vue from 'vue'
import type { Uppy, Plugin } from '@uppy/core'

declare module '@uppy/vue' {
  export class Dashboard extends Vue {
    uppy: Uppy;
    props: Object;
    plugins: Plugin[]

    installPlugin(): void;
    uninstallPlugin(uppy: Uppy): void;
  }
}