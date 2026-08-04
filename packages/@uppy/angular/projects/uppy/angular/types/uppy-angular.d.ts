import * as i0 from '@angular/core';
import { ElementRef, SimpleChanges, OnDestroy, OnChanges } from '@angular/core';
import { Meta, Body, UIPluginOptions, UIPlugin, Uppy } from '@uppy/core';
import Dashboard, { DashboardOptions } from '@uppy/dashboard';
import { StatusBarOptions } from '@uppy/status-bar';

declare abstract class UppyAngularWrapper<M extends Meta, B extends Body, Opts extends UIPluginOptions, PluginType extends UIPlugin<Opts, M, B> = UIPlugin<Opts, M, B>> {
    abstract props: DashboardOptions<M, B>;
    abstract el: ElementRef;
    abstract uppy: Uppy<M, B>;
    private options;
    plugin: PluginType | undefined;
    onMount(defaultOptions: Partial<Opts>, plugin: new (uppy: any, opts?: Opts) => UIPlugin<Opts, M, B>): void;
    handleChanges(changes: SimpleChanges, plugin: any): void;
    uninstall(uppy?: Uppy<M, B>): void;
}

declare class DashboardComponent<M extends Meta, B extends Body> extends UppyAngularWrapper<M, B, DashboardOptions<M, B>> implements OnDestroy, OnChanges {
    el: ElementRef<any>;
    uppy: Uppy<M, B>;
    props: DashboardOptions<M, B>;
    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DashboardComponent<any, any>, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DashboardComponent<any, any>, "uppy-dashboard", never, { "uppy": { "alias": "uppy"; "required": false; }; "props": { "alias": "props"; "required": false; }; }, {}, never, never, true, never>;
}

declare class DashboardModalComponent<M extends Meta, B extends Body> extends UppyAngularWrapper<M, B, DashboardOptions<M, B>, Dashboard<M, B>> implements OnDestroy, OnChanges {
    el: ElementRef<any>;
    uppy: Uppy<M, B>;
    props: DashboardOptions<M, B>;
    open: boolean;
    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DashboardModalComponent<any, any>, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DashboardModalComponent<any, any>, "uppy-dashboard-modal", never, { "uppy": { "alias": "uppy"; "required": false; }; "props": { "alias": "props"; "required": false; }; "open": { "alias": "open"; "required": false; }; }, {}, never, never, true, never>;
}

declare class StatusBarComponent<M extends Meta, B extends Body> extends UppyAngularWrapper<M, B, StatusBarOptions> implements OnDestroy, OnChanges {
    el: ElementRef<any>;
    uppy: Uppy<M, B>;
    props: StatusBarOptions;
    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<StatusBarComponent<any, any>, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<StatusBarComponent<any, any>, "uppy-status-bar", never, { "uppy": { "alias": "uppy"; "required": false; }; "props": { "alias": "props"; "required": false; }; }, {}, never, never, true, never>;
}

export { DashboardComponent, DashboardModalComponent, StatusBarComponent };
