type ToLowercaseKeys<T> = {
  [K in keyof T as K extends string ? Lowercase<K> : never]: T[K];
};

export function transformPreactToSelveteProps<T extends Record<string, any>>(obj: T): ToLowercaseKeys<T> {
  const result = {} as ToLowercaseKeys<T>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowercaseKey = key.toLowerCase() as keyof ToLowercaseKeys<T>;
      // @ts-expect-error don't know how to type
      result[lowercaseKey] = obj[key];
    }
  }
  return result;
}
