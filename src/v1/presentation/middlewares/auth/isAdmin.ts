import { NextFunction, Request, Response } from 'express'

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.user.role !== 'admin') {
    return res.status(401).json({ message: 'Middleware user:isAdmin - Unauthorized (not an admin user)' })
  }

  return next()
}
