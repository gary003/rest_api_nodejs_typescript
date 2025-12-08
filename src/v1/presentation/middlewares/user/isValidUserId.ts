import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const isValidUserId = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params

  const UserIdScheme = z.string().length(36)

  try {
    UserIdScheme.parse(userId)
    next()
    return
  } catch (err) {
    return res.status(404).json({
      middlewareError: `This userId ${userId} is not valid`,
      validationError: String(err)
    })
  }
}
