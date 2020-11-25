import Vue from 'vue';
import { Uppy, Plugin } from '@uppy/core';
import * as DashboardPlugin from '@uppy/dashboard';
interface Data {
    plugin: DashboardPlugin;
}
interface Props {
    uppy: Uppy;
    props: Object;
    plugins: Plugin[];
}
interface Methods {
    installPlugin(): void;
    uninstallPlugin(uppy: Uppy): void;
}
declare const _default: import("vue/types/vue").ExtendedVue<Vue, Data, Methods, unknown, Props>;
export default _default;
