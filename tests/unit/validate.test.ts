import { describe, it, expect } from 'vitest'
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateMinLength,
  validateMaxLength,
  validateEnum,
  validateUUID,
  validateDate,
  validateJsonArray
} from '~/server/utils/validate'

describe('validateRequired', () => {
  it('passes with valid string', () => {
    expect(() => validateRequired('hello', 'Name')).not.toThrow()
  })

  it('passes with number 0', () => {
    expect(() => validateRequired(0, 'Amount')).not.toThrow()
  })

  it('throws on null', () => {
    expect(() => validateRequired(null, 'Name')).toThrow()
    try { validateRequired(null, 'Tên') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('Tên')
    }
  })

  it('throws on undefined', () => {
    expect(() => validateRequired(undefined, 'Name')).toThrow()
  })

  it('throws on empty string', () => {
    expect(() => validateRequired('', 'Name')).toThrow()
  })

  it('throws on whitespace-only string', () => {
    expect(() => validateRequired('   ', 'Name')).toThrow()
  })
})

describe('validateEmail', () => {
  it('passes with valid email', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow()
  })

  it('throws on invalid email (no @)', () => {
    expect(() => validateEmail('userexample.com')).toThrow()
    try { validateEmail('bad') } catch (e: any) {
      expect(e.statusCode).toBe(400)
    }
  })

  it('throws on invalid email (no domain)', () => {
    expect(() => validateEmail('user@')).toThrow()
  })

  it('skips when empty string', () => {
    expect(() => validateEmail('')).not.toThrow()
  })
})

describe('validatePhone', () => {
  it('passes with 10-digit phone', () => {
    expect(() => validatePhone('0901234567')).not.toThrow()
  })

  it('passes with valid lead phone regression case', () => {
    expect(() => validatePhone('0937464945')).not.toThrow()
  })

  it('passes with 9-digit phone', () => {
    expect(() => validatePhone('090123456')).not.toThrow()
  })

  it('passes with 11-digit phone', () => {
    expect(() => validatePhone('09012345678')).not.toThrow()
  })

  it('throws on 8-digit phone', () => {
    expect(() => validatePhone('09012345')).toThrow()
    try { validatePhone('09012345') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('9-11')
    }
  })

  it('throws on phone with letters', () => {
    expect(() => validatePhone('090abc1234')).toThrow()
  })

  it('skips when empty', () => {
    expect(() => validatePhone('')).not.toThrow()
  })

  it('handles phone with spaces (stripped)', () => {
    expect(() => validatePhone('090 123 4567')).not.toThrow()
  })
})

describe('validatePositiveNumber', () => {
  it('passes with positive number', () => {
    expect(() => validatePositiveNumber(100, 'Amount')).not.toThrow()
  })

  it('passes with zero', () => {
    expect(() => validatePositiveNumber(0, 'Amount')).not.toThrow()
  })

  it('throws on negative number', () => {
    expect(() => validatePositiveNumber(-1, 'Amount')).toThrow()
    try { validatePositiveNumber(-5, 'Số tiền') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('không âm')
    }
  })

  it('skips on null', () => {
    expect(() => validatePositiveNumber(null as any, 'Amount')).not.toThrow()
  })

  it('throws on string input', () => {
    expect(() => validatePositiveNumber('abc' as any, 'Amount')).toThrow()
  })
})

describe('validateMinLength', () => {
  it('passes when string is long enough', () => {
    expect(() => validateMinLength('hello', 3, 'Name')).not.toThrow()
  })

  it('passes when exact min length', () => {
    expect(() => validateMinLength('abc', 3, 'Name')).not.toThrow()
  })

  it('throws when too short', () => {
    expect(() => validateMinLength('hi', 3, 'Name')).toThrow()
    try { validateMinLength('ab', 5, 'Tiêu đề') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('ít nhất')
    }
  })

  it('skips when empty', () => {
    expect(() => validateMinLength('', 3, 'Name')).not.toThrow()
  })
})

describe('validateMaxLength', () => {
  it('passes when within limit', () => {
    expect(() => validateMaxLength('hi', 10, 'Name')).not.toThrow()
  })

  it('throws when too long', () => {
    expect(() => validateMaxLength('hello world', 5, 'Name')).toThrow()
    try { validateMaxLength('abcdef', 3, 'Mã') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('quá')
    }
  })

  it('skips when empty', () => {
    expect(() => validateMaxLength('', 5, 'Name')).not.toThrow()
  })
})

describe('validateEnum', () => {
  const allowed = ['material', 'labor', 'other']

  it('passes with valid value', () => {
    expect(() => validateEnum('material', allowed, 'Type')).not.toThrow()
  })

  it('throws on invalid value', () => {
    expect(() => validateEnum('invalid', allowed, 'Type')).toThrow()
    try { validateEnum('xyz', allowed, 'Loại') } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.statusMessage).toContain('material')
    }
  })

  it('skips when empty', () => {
    expect(() => validateEnum('', allowed, 'Type')).not.toThrow()
  })
})

describe('validateUUID', () => {
  it('passes with valid UUID', () => {
    expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000', 'ID')).not.toThrow()
  })

  it('throws on invalid string', () => {
    expect(() => validateUUID('not-a-uuid', 'ID')).toThrow()
    try { validateUUID('abc', 'ID') } catch (e: any) {
      expect(e.statusCode).toBe(400)
    }
  })

  it('skips when empty', () => {
    expect(() => validateUUID('', 'ID')).not.toThrow()
  })
})

describe('validateDate', () => {
  it('passes with valid date string', () => {
    expect(() => validateDate('2026-03-20', 'Date')).not.toThrow()
  })

  it('passes with ISO string', () => {
    expect(() => validateDate('2026-03-20T10:00:00Z', 'Date')).not.toThrow()
  })

  it('throws on invalid date', () => {
    expect(() => validateDate('not-a-date', 'Date')).toThrow()
    try { validateDate('abc', 'Ngày') } catch (e: any) {
      expect(e.statusCode).toBe(400)
    }
  })

  it('skips when empty', () => {
    expect(() => validateDate('', 'Date')).not.toThrow()
  })
})

describe('validateJsonArray', () => {
  it('passes with valid JSON array', () => {
    expect(() => validateJsonArray('["a","b"]', 'Items')).not.toThrow()
  })

  it('throws on JSON object (not array)', () => {
    expect(() => validateJsonArray('{"a":1}', 'Items')).toThrow()
  })

  it('throws on invalid JSON', () => {
    expect(() => validateJsonArray('not json', 'Items')).toThrow()
  })

  it('skips when empty', () => {
    expect(() => validateJsonArray('', 'Items')).not.toThrow()
  })
})
