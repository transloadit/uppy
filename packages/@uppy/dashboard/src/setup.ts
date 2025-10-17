import { setupWorker } from 'msw/browser'
import { handlers } from '../src/mocks/CompanionHandler.js'

export const worker = setupWorker(...handlers)
