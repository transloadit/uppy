import type { ElementRef, SimpleChanges } from "@angular/core";
import {
	type Body,
	type Meta,
	type UIPlugin,
	type UIPluginOptions,
	Uppy,
} from "@uppy/core";
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

	// The instance we created ourselves because no `uppy` was passed in. We own it, so we
	// have to destroy it - otherwise it keeps the `online`/`offline` listeners that Uppy
	// registers on `window` alive forever, which leaks the whole instance.
	private ownUppy: Uppy<M, B> | undefined;

	// The instance the plugin is currently installed on. This is what we have to compare
	// against when `uppy` changes; `changes['uppy'].previousValue` is `undefined` for the
	// first change and therefore cannot tell us what we are actually mounted on.
	private mountedUppy: Uppy<M, B> | undefined;

	onMount(
		defaultOptions: Partial<Opts>,
		plugin: new (uppy: any, opts?: Opts) => UIPlugin<Opts, M, B>,
	) {
		this.options = {
			...defaultOptions,
			...this.props,
		};
		this.install(plugin);
	}

	// Installs the plugin on `this.uppy`, falling back to an instance of our own when no
	// `uppy` is passed in (or the bound value is `undefined`/`null`). Angular always runs
	// `ngOnChanges` before `ngOnInit`, so a bound `uppy` is already set by the time
	// `onMount` gets here and we never create an instance we'd have to throw away.
	private install(
		plugin: new (uppy: any, opts?: Opts) => UIPlugin<Opts, M, B>,
	): void {
		if (!this.uppy) {
			this.ownUppy ??= new Uppy<M, B>();
			this.uppy = this.ownUppy;
		}
		this.uppy.use(plugin, this.options);
		this.mountedUppy = this.uppy;
		this.plugin = this.uppy.getPlugin(this.options.id) as PluginType;
	}

	handleChanges(changes: SimpleChanges, plugin: any): void {
		const { mountedUppy } = this;
		// `ngOnChanges` runs before `ngOnInit`, so there is nothing to reconcile until
		// `onMount` has installed the plugin.
		if (mountedUppy === undefined) return;

		if (changes["uppy"]) {
			// `ownUppy` only exists while we're mounted on it, so if the binding goes from one
			// empty value to another we simply stay where we are.
			if (!this.uppy && this.ownUppy) this.uppy = this.ownUppy;
			if (this.uppy !== mountedUppy) {
				this.uninstall(mountedUppy);
				this.install(plugin);
			}
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

	// Defaults to the instance we are actually mounted on rather than to `this.uppy`, so that
	// we still clean up correctly if `uppy` was swapped without Angular reporting a change.
	uninstall(uppy: Uppy<M, B> = this.mountedUppy ?? this.uppy): void {
		if (this.plugin !== undefined) {
			uppy.removePlugin(this.plugin);
			this.plugin = undefined;
		}
		if (uppy === this.mountedUppy) {
			this.mountedUppy = undefined;
		}
		if (this.ownUppy !== undefined && uppy === this.ownUppy) {
			// We created this one, so we are the ones who have to destroy it. Instances that
			// were passed in stay the caller's responsibility.
			this.ownUppy.destroy();
			this.ownUppy = undefined;
		}
	}
}
