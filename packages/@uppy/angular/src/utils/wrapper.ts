import type { ElementRef, SimpleChanges } from "@angular/core";
import type { UIPlugin, UIPluginOptions, Uppy, Body, Meta } from "@uppy/core";
import type { DashboardOptions } from "@uppy/dashboard";

export abstract class UppyAngularWrapper<
	M extends Meta,
	B extends Body,
	Opts extends UIPluginOptions,
	PluginType extends UIPlugin<Opts, M, B> = UIPlugin<Opts, M, B>,
> {
	abstract props: DashboardOptions<M, B>;
	abstract el: ElementRef;
	abstract uppy: Uppy<M, B>;
	private options: any;
	plugin: PluginType | undefined;

	onMount(
		defaultOptions: Partial<Opts>,
		plugin: new (uppy: any, opts?: Opts) => UIPlugin<Opts, M, B>,
	) {
		this.options = {
			...defaultOptions,
			...this.props,
		};

		this.uppy.use(plugin, this.options);
		this.plugin = this.uppy.getPlugin(this.options.id) as PluginType;
	}

	handleChanges(changes: SimpleChanges, plugin: any): void {
		// Without the last part of this conditional, it tries to uninstall before the plugin is mounted
		if (
			changes["uppy"] &&
			this.uppy !== changes["uppy"].previousValue &&
			changes["uppy"].previousValue !== undefined
		) {
			this.uninstall(changes["uppy"].previousValue);
			// @ts-expect-error The options correspond to the plugin, I swear
			this.uppy.use(plugin, this.options);
		}
		this.options = { ...this.options, ...this.props };
		this.plugin = this.uppy.getPlugin(this.options.id) as PluginType;
		if (
			changes["props"] &&
			this.props !== changes["props"].previousValue &&
			changes["props"].previousValue !== undefined
		) {
			this.plugin.setOptions({ ...this.options });
		}
	}

	uninstall(uppy = this.uppy): void {
		uppy.removePlugin(this.plugin!);
	}
}
