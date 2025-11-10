import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import logger from '../../../helpers/logger'
import { loggedUser } from '../../../domain/dto/loggedUser.dto'

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ').at(1)

  // logger.debug('headers: ' + token)

  if (!token) {
    return res.status(401).json({ message: 'Middleware user:isAdmin - Unauthorized, failed to get a valid token' })
  }

  try {
    const userFromToken = jwt.verify(String(token), process.env.JWT_SECRET_KEY || 'secret') as loggedUser

    req.body.user = userFromToken

    if (userFromToken.role !== 'admin') {
      return res.status(401).json({ message: 'Middleware user:isAdmin - Unauthorized (not an admin user)' })
    }

    return next()
  } catch (error) {
    logger.error(`isAdin: ${error}`)
    return res.status(401).json({ message: 'Middleware user:isAdmin - Unauthorized - wrong rights (not admin)' })
  }
}

export default isAdmin
