import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { errorValidationUser } from './error.dto'

export const validateUserIdParams = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params

  const UserIdScheme = z.string().length(36)

  try {
    UserIdScheme.parse(userId)
    next()
    return
  } catch (err) {
    return res.status(404).send(errorValidationUser)
  }
}
