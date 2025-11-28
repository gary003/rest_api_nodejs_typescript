import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const isValidRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body

  const RefreshTokenSchema = z.string().min(1)

  try {
    RefreshTokenSchema.parse(refreshToken)
    next()
    return
  } catch (err) {
    return res.status(401).json({
      middlewareError: 'Refresh Token Required',
      validationError: String(err)
    })
  }
}
