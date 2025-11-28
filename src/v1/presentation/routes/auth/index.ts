import { Router, Request, Response } from 'express'
// import logger from '../../../helpers/logger'
import jwt from 'jsonwebtoken'
import logger from '../../../helpers/logger'
import { isValidRefreshToken } from '../../middlewares/validation/route_auth'

const authRouter = Router()

authRouter.route('/getToken').post(async (req: Request, res: Response) => {
  try {
    const userInfo = req.body.loggedUser

    logger.debug('presentation:routes:auth:getToken - ' + JSON.stringify(req.body))

    const accessToken = jwt.sign(userInfo, process.env.JWT_SECRET_KEY || 'secret', { expiresIn: '60s' })
    const refreshToken = jwt.sign(userInfo, process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret', { expiresIn: '1d' })

    return res.status(200).json({ accessToken, refreshToken })
  } catch (err) {
    const errInfo: string = `presentation:routes:auth:getToken - Internal Server Error - ${err}`
    logger.error(errInfo)
    return res.status(500).send(errInfo)
  }
})

authRouter.route('/refreshToken').post(isValidRefreshToken, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    const response = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret')
    
    if (response instanceof Error) return res.status(403).send('Invalid Refresh Token')

    // Remove exp and iat from user object before signing new token
    const { exp, iat, ...userInfo } = response as jwt.JwtPayload

    logger.debug('presentation:routes:auth:refreshToken - ' + JSON.stringify(response))

    const accessToken = jwt.sign(userInfo, process.env.JWT_SECRET_KEY || 'secret', { expiresIn: '15m' })
    return res.status(200).json({ accessToken })
  } catch (err) {
    const errInfo: string = `presentation:routes:auth:refreshToken - Internal Server Error - ${err}`
    logger.error(errInfo)
    return res.status(500).send(errInfo)
  }
})

export default authRouter
