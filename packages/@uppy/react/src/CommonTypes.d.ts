export { Uppy } from '../../core/types';

export interface Locale {
    strings: { [index: string]: string };
    pluralize: (noun: string) => string;
}
