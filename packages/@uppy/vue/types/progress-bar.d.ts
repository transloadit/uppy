import Vue from 'vue'
import type { Uppy, UIPlugin, BasePlugin } from '@uppy/core'

interface Data {
    plugin: UIPlugin | BasePlugin;
}
interface Props {
    uppy: Uppy;
    props: Record<string, unknown>;
}
interface Methods {
    installPlugin(): void;
    uninstallPlugin(uppy: Uppy): void;
}
declare const exports: import('vue/types/vue').ExtendedVue<Vue, Data, Methods, unknown, Props>
export default exports
