import { Uppy, Plugin } from '@uppy/core';
import { ElementRef, SimpleChanges } from '@angular/core';

export abstract class UppyAngularWrapper {
    abstract props;
    abstract el: ElementRef;
    abstract uppy: Uppy;
    private options: any;
    plugin: Plugin;

    handleChanges(changes: SimpleChanges, plugin: any, defaultOptions: any): void {
        if (changes.uppy && this.uppy !== changes.uppy.previousValue) {
            this.uninstall(changes.uppy.previousValue);
        }
        this.options = {
            ...defaultOptions,
            ...this.props,
        };
        if (this.uppy.getPlugin(this.options.id)) {
            this.uninstall();
        }
        this.uppy.use(plugin, this.options);
        this.plugin = this.uppy.getPlugin(this.options.id);
    }

    uninstall(uppy = this.uppy): void {
        uppy.removePlugin(this.plugin);
    }

}
