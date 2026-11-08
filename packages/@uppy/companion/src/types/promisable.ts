/** A value, or a promise (or thenable) of that value. */
export type Promisable<T> = T | PromiseLike<T>
