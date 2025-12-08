import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

import { isTokenValid } from '../../../services/auth'

export const isValidRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body

  const RefreshTokenSchema = z.string().min(1)

  try {
    RefreshTokenSchema.parse(refreshToken)

    const isValid = await isTokenValid(refreshToken)
    if (!isValid) {
      return res.status(401).json({
        middlewareError: 'Invalid Refresh Token',
        validationError: 'Token not found or expired'
      })
    }

    next()
    return
  } catch (err) {
    return res.status(401).json({
      middlewareError: 'Refresh Token Required',
      validationError: String(err)
    })
  }
}
