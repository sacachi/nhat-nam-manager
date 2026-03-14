import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'nhatnam_super_secret_key_123'

export const signToken = (payload: any) => {
  return jwt.sign(payload, secret, { expiresIn: '1d' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}
