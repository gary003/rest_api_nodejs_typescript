import { Router, Request, Response } from 'express'
// import logger from '../../../helpers/logger'
import jwt from 'jsonwebtoken'
import logger from '../../../helpers/logger'

const authRouter = Router()

authRouter.route('/').post(async (req: Request, res: Response) => {
  try {
    const userInfo = req.body.loggedUser

    logger.debug('route:auth - ' + JSON.stringify(req.body))

    const tokenUser = jwt.sign(userInfo, process.env.JWT_SECRET_KEY || 'secret', { expiresIn: 30 })

    return res.status(200).json(tokenUser)
  } catch (err) {
    const errInfo: string = `route:auth - Internal Server Error - ${err}`
    return res.status(500).send(errInfo)
  }
})

export default authRouter
