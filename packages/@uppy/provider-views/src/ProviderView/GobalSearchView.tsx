import type { UnknownProviderPlugin } from "@uppy/core";
import type { CompanionFile, I18n } from "@uppy/utils";
import type { Meta, Body } from "@uppy/utils";


type SearchResults = CompanionFile[]

const checkedState: Map<string, string> = new Map();


interface GlobalSearchProviderViewOptions<M extends Meta, B extends Body>{
    provider: UnknownProviderPlugin<M, B>['provider']
    plugin: UnknownProviderPlugin<M, B>
    i18n: I18n
}

export default class GlobalSearchiew<M extends Meta , B extends Body>{

    private provider : UnknownProviderPlugin<M, B>['provider']

    private plugin : UnknownProviderPlugin<M,B>

    private i18n: I18n




    constructor(options: GlobalSearchProviderViewOptions<M, B>){
        this.provider = options.provider
        this.plugin = options.plugin
        this.i18n = options.i18n
    }
}