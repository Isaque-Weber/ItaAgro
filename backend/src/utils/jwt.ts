// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken'

/**
 * Gera um token JWT com o secret definido em .env
 */
export function signJwt(
    payload: object,
    options?: jwt.SignOptions
): string {
    const secret = process.env.JWT_SECRET!
    return jwt.sign(payload, secret, options)
}

/**
 * Verifica/decodifica um token JWT
 */
export function verifyJwt(token: string): any {
    const secret = process.env.JWT_SECRET!
    return jwt.verify(token, secret)
}
