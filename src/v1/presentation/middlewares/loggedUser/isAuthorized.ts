import { NextFunction, Request, Response } from 'express'
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import logger from '../../../helpers/logger'
// import { loggedUser } from '../../../domain/dto/loggedUser.dto'

const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ').at(1)

  logger.debug('headers: ' + token)

  if (!token) {
    return res.status(401).json({ message: 'Middleware:isAuthorized, failed to get a valid token' })
  }

  try {
    const userFromToken = jwt.verify(token, process.env.JWT_SECRET_KEY || 'secret')

    logger.debug(JSON.stringify(userFromToken))

    req.body.user = userFromToken

    return next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      logger.error(`Middleware:isAuthorized: Token expired at ${error.expiredAt}`)
      return res.status(401).json({
        message: 'Middleware:isAuthorized - Token expired',
        expiredAt: error.expiredAt
      })
    }

    if (error instanceof JsonWebTokenError) {
      logger.error(`Middleware:isAuthorized: Invalid token - ${error.message}`)
      return res.status(401).json({
        message: 'Middleware:isAuthorized - Invalid token',
        error: error.message
      })
    }

    logger.error(`Middleware:isAuthorized: Unexpected error - ${error}`)
    return res.status(401).json({ message: 'Middleware:isAuthorized - Authentication failed' })
  }
}

export default isAuthorized
