import { describe, expect, it } from 'vitest'
import {
  ACCEPTED_RESPONSE_STATUSES,
  UnexpectedResponseStatusError,
  ensureAcceptedResponseStatus,
  getRequestErrorMessage
} from '~/utils/request-feedback'

describe('request-feedback', () => {
  it('accepts response status 200', () => {
    expect(() => ensureAcceptedResponseStatus(200)).not.toThrow()
  })

  it('accepts response status 202', () => {
    expect(() => ensureAcceptedResponseStatus(202)).not.toThrow()
  })

  it('rejects response status outside 200 and 202', () => {
    expect(ACCEPTED_RESPONSE_STATUSES).toEqual([200, 202])
    expect(() => ensureAcceptedResponseStatus(201)).toThrow(UnexpectedResponseStatusError)
  })

  it('prefers API statusMessage when present', () => {
    const message = getRequestErrorMessage({
      data: {
        statusMessage: 'Số điện thoại không hợp lệ'
      }
    }, 'Fallback message')

    expect(message).toBe('Số điện thoại không hợp lệ')
  })

  it('falls back to generic message when error payload is empty', () => {
    expect(getRequestErrorMessage({}, 'Fallback message')).toBe('Fallback message')
  })
})