// eslint-disable-next-line import/prefer-default-export
export const isVue2 = (...args) => {
  return args.length > 0 && typeof args[0] === 'function'
}
