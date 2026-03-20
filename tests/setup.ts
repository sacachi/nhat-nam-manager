import { vi } from 'vitest'

// Mock h3 createError globally for unit tests
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as any
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
})
