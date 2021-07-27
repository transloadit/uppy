import Vue from 'vue';
import { Uppy, Plugin } from '@uppy/core';
interface Data {
    plugin: Plugin;
}
interface Props {
    uppy: Uppy;
    props: Object;
}
interface Methods {
    installPlugin(): void;
    uninstallPlugin(uppy: Uppy): void;
}
declare const _default: import("vue/types/vue").ExtendedVue<Vue, Data, Methods, unknown, Props>;
export default _default;
