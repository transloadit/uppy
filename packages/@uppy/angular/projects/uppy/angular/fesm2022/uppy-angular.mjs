import * as i0 from '@angular/core';
import { inject, ElementRef, Input, ChangeDetectionStrategy, Component } from '@angular/core';
import { Uppy } from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import DragDrop from '@uppy/drag-drop';
import ProgressBar from '@uppy/progress-bar';
import StatusBar from '@uppy/status-bar';

class UppyAngularWrapper {
    onMount(defaultOptions, plugin) {
        this.options = {
            ...defaultOptions,
            ...this.props,
        };
        this.uppy.use(plugin, this.options);
        this.plugin = this.uppy.getPlugin(this.options.id);
    }
    handleChanges(changes, plugin) {
        // Without the last part of this conditional, it tries to uninstall before the plugin is mounted
        if (changes["uppy"] &&
            this.uppy !== changes["uppy"].previousValue &&
            changes["uppy"].previousValue !== undefined) {
            this.uninstall(changes["uppy"].previousValue);
            // @ts-expect-error The options correspond to the plugin, I swear
            this.uppy.use(plugin, this.options);
        }
        this.options = { ...this.options, ...this.props };
        this.plugin = this.uppy.getPlugin(this.options.id);
        if (changes["props"] &&
            this.props !== changes["props"].previousValue &&
            changes["props"].previousValue !== undefined) {
            this.plugin.setOptions({ ...this.options });
        }
    }
    uninstall(uppy = this.uppy) {
        uppy.removePlugin(this.plugin);
    }
}

class DashboardComponent extends UppyAngularWrapper {
    constructor() {
        super();
        this.el = inject(ElementRef);
        this.uppy = new Uppy();
        this.props = {};
    }
    ngOnInit() {
        this.onMount({ id: "angular:Dashboard", inline: true, target: this.el.nativeElement }, Dashboard);
    }
    ngOnChanges(changes) {
        this.handleChanges(changes, Dashboard);
    }
    ngOnDestroy() {
        this.uninstall();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DashboardComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.5", type: DashboardComponent, isStandalone: true, selector: "uppy-dashboard", inputs: { uppy: "uppy", props: "props" }, usesInheritance: true, usesOnChanges: true, ngImport: i0, template: "", isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DashboardComponent, decorators: [{
            type: Component,
            args: [{
                    selector: "uppy-dashboard",
                    template: "",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { uppy: [{
                type: Input
            }], props: [{
                type: Input
            }] } });

class DashboardModalComponent extends UppyAngularWrapper {
    constructor() {
        super();
        this.el = inject(ElementRef);
        this.uppy = new Uppy();
        this.props = {};
        this.open = false;
    }
    ngOnInit() {
        this.onMount({
            id: "angular:DashboardModal",
            inline: false,
            target: this.el.nativeElement,
        }, Dashboard);
    }
    ngOnChanges(changes) {
        this.handleChanges(changes, Dashboard);
        // Handle dashboard-modal specific changes
        if (changes["open"] && this.open !== changes["open"].previousValue) {
            if (this.open && !changes["open"].previousValue) {
                this.plugin.openModal();
            }
            if (!this.open && changes["open"].previousValue) {
                this.plugin.closeModal();
            }
        }
    }
    ngOnDestroy() {
        this.uninstall();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DashboardModalComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.5", type: DashboardModalComponent, isStandalone: true, selector: "uppy-dashboard-modal", inputs: { uppy: "uppy", props: "props", open: "open" }, usesInheritance: true, usesOnChanges: true, ngImport: i0, template: "", isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DashboardModalComponent, decorators: [{
            type: Component,
            args: [{
                    selector: "uppy-dashboard-modal",
                    template: "",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { uppy: [{
                type: Input
            }], props: [{
                type: Input
            }], open: [{
                type: Input
            }] } });

class DragDropComponent extends UppyAngularWrapper {
    constructor() {
        super();
        this.el = inject(ElementRef);
        this.uppy = new Uppy();
        this.props = {};
    }
    ngOnInit() {
        this.onMount({ id: "angular:DragDrop", target: this.el.nativeElement }, DragDrop);
    }
    ngOnChanges(changes) {
        this.handleChanges(changes, DragDrop);
    }
    ngOnDestroy() {
        this.uninstall();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DragDropComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.5", type: DragDropComponent, isStandalone: true, selector: "uppy-drag-drop", inputs: { uppy: "uppy", props: "props" }, usesInheritance: true, usesOnChanges: true, ngImport: i0, template: "", isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: DragDropComponent, decorators: [{
            type: Component,
            args: [{
                    selector: "uppy-drag-drop",
                    template: "",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { uppy: [{
                type: Input
            }], props: [{
                type: Input
            }] } });

class ProgressBarComponent extends UppyAngularWrapper {
    constructor() {
        super();
        this.el = inject(ElementRef);
        this.uppy = new Uppy();
        this.props = {};
    }
    ngOnInit() {
        this.onMount({ id: "angular:ProgressBar", target: this.el.nativeElement }, ProgressBar);
    }
    ngOnChanges(changes) {
        this.handleChanges(changes, ProgressBar);
    }
    ngOnDestroy() {
        this.uninstall();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: ProgressBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.5", type: ProgressBarComponent, isStandalone: true, selector: "uppy-progress-bar", inputs: { uppy: "uppy", props: "props" }, usesInheritance: true, usesOnChanges: true, ngImport: i0, template: "", isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: ProgressBarComponent, decorators: [{
            type: Component,
            args: [{
                    selector: "uppy-progress-bar",
                    template: "",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { uppy: [{
                type: Input
            }], props: [{
                type: Input
            }] } });

class StatusBarComponent extends UppyAngularWrapper {
    constructor() {
        super();
        this.el = inject(ElementRef);
        this.uppy = new Uppy();
        this.props = {};
    }
    ngOnInit() {
        this.onMount({ id: "angular:StatusBar", target: this.el.nativeElement }, StatusBar);
    }
    ngOnChanges(changes) {
        this.handleChanges(changes, StatusBar);
    }
    ngOnDestroy() {
        this.uninstall();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: StatusBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.5", type: StatusBarComponent, isStandalone: true, selector: "uppy-status-bar", inputs: { uppy: "uppy", props: "props" }, usesInheritance: true, usesOnChanges: true, ngImport: i0, template: "", isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.5", ngImport: i0, type: StatusBarComponent, decorators: [{
            type: Component,
            args: [{
                    selector: "uppy-status-bar",
                    template: "",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { uppy: [{
                type: Input
            }], props: [{
                type: Input
            }] } });

/*
 * Public API Surface of @uppy/angular
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DashboardComponent, DashboardModalComponent, DragDropComponent, ProgressBarComponent, StatusBarComponent };
//# sourceMappingURL=uppy-angular.mjs.map
