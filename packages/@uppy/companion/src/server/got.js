const loadingModule = import('got').then(({ default: got }) => {
    module.exports = got
    return got
  })
  
  const handler = {
    __proto__: null,
    get(target, key) {
      return async (...args) => {
        const module = await loadingModule
        let intermediate = module[target.key](...target.args)
        if (key === 'then') intermediate = Promise.resolve(intermediate)
        return intermediate[key](...args)
      }
    },
  }
  
  /**
   * @typedef {typeof import('got')}
   */
  module.exports = new Proxy(
    {},
    {
      // @ts-expect-error __proto__ is fine here.
      __proto__: null,
      get(target, key) {
        return (...args) => {
          return key === 'then'
            ? loadingModule.then(...args)
            : new Proxy(
                {
                  key,
                  args,
                },
                handler,
              )
        }
      },
    },
  )
  