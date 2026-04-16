import type { ElementRef, SimpleChanges } from "@angular/core";
import type { UIPlugin, UIPluginOptions, Body, Meta } from "@uppy/core";
import type { DashboardOptions } from "@uppy/dashboard";
import { Uppy } from "@uppy/core";

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
    
    private uppyInstanceManagedByThisClass?: Uppy<M, B>;
    
    /**
     * If extending classes need an initial instance of Uppy - use this one; it will be destroyed when needed to avoid memory leaks.
     */
    protected createInitialUppy(): Uppy<M, B> {
        if (!this.uppyInstanceManagedByThisClass)
            // the instance of Uppy that is created here - we are in charge of destroying it when it's no longer used
            this.uppyInstanceManagedByThisClass = new Uppy();

        return this.uppyInstanceManagedByThisClass;
    }

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
		if (changes["uppy"])
		{
            // "uppy" should never get set to null/undefined - that is not supported
            
    		// Without the undefined check below, initially it would try to uninstall before the plugin is mounted (ngOnChanges
            // that calls this gets called before ngOnInit that calls onMount if uppy is an @Input in derived classes; so the
            // "uppyInstanceManagedByThisClass" didn't even get to be used; and changes["uppy"].previousValue doesn't give
            // that anyway initially, but undefined, as that value was a 'default')
            if (this.uppy !== changes["uppy"].previousValue && changes["uppy"].previousValue !== undefined) {
                // we had an actively used Uppy that now changed
                this.uninstall(changes["uppy"].previousValue); // this also destroys old Uppy if needed
                // @ts-expect-error The options correspond to the plugin, I swear
                this.uppy.use(plugin, this.options);
            } else {
                // can get here from derived classes on the initial ngOnChanges call of @Input uppy for example; previousValue
                // is undefined then, even if we did have a this.uppy from constructor (now replaced) that was not yet making
                // use of the plugin; so we don't uninstall (that also does destroy) here, just destroy if needed
                let previousValueIncludingDefault = changes["uppy"].previousValue ? changes["uppy"].previousValue
                                                        : this.uppyInstanceManagedByThisClass;
                if (this.uppy !== previousValueIncludingDefault)
                    this.destroyUppyIfNeeed(previousValueIncludingDefault);
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

	uninstall(uppy: Uppy<M, B> = this.uppy): void {
		uppy.removePlugin(this.plugin!);
        this.destroyUppyIfNeeed(uppy);
	}
    
    private destroyUppyIfNeeed(uppyThatWillNoLongerBeUsed: Uppy<M, B>): void {
        // "uppyThatWillNoLongerBeUsed" is either the "uppyInstanceManagedByThisClass" or it's received via derived classes
        // from the outside (as an "@input" for example); if the Uppy that this instance created is no longer used,
        // we need to destroy it in order to avoid memory leaks
        
        if (uppyThatWillNoLongerBeUsed === this.uppyInstanceManagedByThisClass) {
            this.uppyInstanceManagedByThisClass.destroy();
            delete this.uppyInstanceManagedByThisClass;
        } // else whoever provided the Uppy instance (as @Input maybe) is in charge of destroying it
    }

}
