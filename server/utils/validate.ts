import { createError } from 'h3'

export const validateRequired = (value: any, fieldName: string) => {
  if (value === undefined || value === null || value === '') {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} là bắt buộc` })
  }
  if (typeof value === 'string' && !value.trim()) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} không được để trống` })
  }
}

export const validateEmail = (email: string) => {
  if (!email) return
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email không hợp lệ' })
  }
}

export const validatePhone = (phone: string) => {
  if (!phone) return
  const phoneRegex = /^[0-9]{9,11}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw createError({ statusCode: 400, statusMessage: 'Số điện thoại không hợp lệ (9-11 chữ số)' })
  }
}

export const validatePositiveNumber = (value: number, fieldName: string) => {
  if (value === undefined || value === null) return
  if (typeof value !== 'number' || value < 0) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} phải là số không âm` })
  }
}

export const validateMinLength = (value: string, minLength: number, fieldName: string) => {
  if (!value) return
  if (value.length < minLength) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} phải có ít nhất ${minLength} ký tự` })
  }
}

export const validateMaxLength = (value: string, maxLength: number, fieldName: string) => {
  if (!value) return
  if (value.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} không được quá ${maxLength} ký tự` })
  }
}

export const validateEnum = (value: string, allowedValues: string[], fieldName: string) => {
  if (!value) return
  if (!allowedValues.includes(value)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: `${fieldName} không hợp lệ. Giá trị cho phép: ${allowedValues.join(', ')}` 
    })
  }
}

export const validateUUID = (value: string, fieldName: string) => {
  if (!value) return
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} không hợp lệ` })
  }
}

export const validateDate = (value: string, fieldName: string) => {
  if (!value) return
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} không hợp lệ` })
  }
}

export const validateFutureDate = (value: string, fieldName: string) => {
  if (!value) return
  validateDate(value, fieldName)
  const date = new Date(value)
  if (date < new Date()) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} phải là ngày trong tương lai` })
  }
}

export const validateJsonArray = (value: string, fieldName: string) => {
  if (!value) return
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} phải là mảng JSON` })
    }
  } catch {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} không hợp lệ` })
  }
}
