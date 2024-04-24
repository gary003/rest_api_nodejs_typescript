import { Router, Request, Response } from "express"
import { deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser } from "../../services/user/index"

import { errorAPIUSER } from "./error.dto"

import logger from "../../../helpers/logger"
import { validateUserIdParams } from "./validation"

const userRouter = Router()

userRouter
  .route("/")
  .get(async (_: Request, res: Response) => {
    const results = await getAllUsers().catch((err) => {
      logger.error(err)
      return null
    })

    if (!results) return res.status(500).json(errorAPIUSER.errorAPIGetAllUsers)

    return res.status(200).json({ data: results })
  })
  .post(async (req: Request, res: Response) => {
    const { userId, firstname, lastname } = req.body

    const result = await saveNewUser(userId, firstname, lastname).catch((err) => {
      logger.error(err)
      return null
    })

    if (!result) return res.status(500).json(errorAPIUSER.errorAPIUserCreation)

    return res.status(200).json({ data: result })
  })

userRouter
  .route("/:userId")
  .get(async (req: Request, res: Response) => {
    const userId = await validateUserIdParams(req.params.userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (!userId) {
      return res.status(400).json(errorAPIUSER.errorAPIInvalidUserId)
    }

    const result = await getUserWalletInfo(userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (!result) return res.status(500).json(errorAPIUSER.errorAPIGetUser)

    return res.status(200).json({ data: result })
  })
  .delete(async (req: Request, res: Response) => {
    const userId = await validateUserIdParams(req.params.userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (!userId) {
      return res.status(400).json(errorAPIUSER.errorAPIInvalidUserId)
    }

    const result = await deleteUserById(userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (!result) return res.status(500).json(errorAPIUSER.errorAPIDeleteUser)

    return res.status(200).json({ data: result })
  })

export default userRouter
