import Vue from 'vue'
import type { Uppy, Plugin } from '@uppy/core'

declare module '@uppy/vue' {
  export class Dashboard extends Vue {
    uppy: Uppy;
    props: Object;
    plugins: Plugin[];

    private installPlugin(): void;
    private uninstallPlugin(uppy: Uppy): void;
  }
  export class DashboardModal extends Vue {
    uppy: Uppy;
    props: Object;
    plugins: Plugin[];
    open: boolean;

    private installPlugin(): void;
    private uninstallPlugin(uppy: Uppy): void;
  }

  export class DragDrop extends Vue {
    uppy: Uppy;
    props: Object;

    private installPlugin(): void;
    private uninstallPlugin(uppy: Uppy): void;
  }
  export class ProgresBar extends Vue {
    uppy: Uppy;
    props: Object;

    private installPlugin(): void;
    private uninstallPlugin(uppy: Uppy): void;
  }
  export class StatusBar extends Vue {
    uppy: Uppy;
    props: Object;

    private installPlugin(): void;
    private uninstallPlugin(uppy: Uppy): void;
  }
}