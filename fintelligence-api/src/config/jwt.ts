import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod'
const EXPIRES_IN = '30d'

export interface JwtPayload {
  userId: string
  email: string
  firstName?: string
  lastName?: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
