// We need explicit type declarations for `errors.js` because of a typescript bug when generating declaration files.
// I think it's this one:
// https://github.com/microsoft/TypeScript/issues/37832
//
// We could try removing this file when we upgrade to 4.1 :)

export class ProviderApiError extends Error {
  constructor(message: string, statusCode: number)
}
export class ProviderAuthError extends ProviderApiError {
  constructor()
}

export function errorToResponse(anyError: Error): { code: number, message: string }
