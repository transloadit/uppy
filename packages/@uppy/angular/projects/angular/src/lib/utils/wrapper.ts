import { Uppy, Plugin } from '@uppy/core';
import { ElementRef, SimpleChanges } from '@angular/core';

export abstract class UppyAngularWrapper<PluginType extends Plugin  = Plugin> {
    abstract props;
    abstract el: ElementRef
    abstract uppy: Uppy;
    private options: any;
    plugin: PluginType;

    onMount(defaultOptions, plugin) {
      this.options = {
        ...defaultOptions,
        ...this.props,
      };

      this.uppy.use(plugin, this.options);
      this.plugin = this.uppy.getPlugin(this.options.id) as PluginType;
    }

    handleChanges(changes: SimpleChanges, plugin: any): void {
      // Without the last part of this conditional, it tries to uninstall before the plugin is mounted
      if (changes.uppy && this.uppy !== changes.uppy.previousValue && changes.uppy.previousValue !== undefined) {
          this.uninstall(changes.uppy.previousValue);
          this.uppy.use(plugin, this.options);
      }
      this.options = { ...this.options, ...this.props }
      this.plugin = this.uppy.getPlugin(this.options.id) as PluginType;
      if(changes.props && this.props !== changes.props.previousValue && changes.props.previousValue !== undefined) {
        this.plugin.setOptions({ ...this.options })
      }
    }

    uninstall(uppy = this.uppy): void {
        console.log('Uninstalling...')
        uppy.removePlugin(this.plugin);
    }

}
