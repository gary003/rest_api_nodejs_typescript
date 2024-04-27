import { Router, Request, Response } from "express"
import { deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser } from "../../services/user/index"

import { errorAPIUSER } from "./error.dto"

import logger from "../../../helpers/logger"
import { validateUserIdParams } from "./validation"
import { apiResponseGetAllUserType, apiResponseGetUserType, apiResponseCreateUserType, apiResponseDeleteUserType } from "./apiResponse.dto"

const userRouter = Router()

userRouter
  .route("/")
  .get(async (_: Request, res: Response) => {
    const results = await getAllUsers().catch((err) => {
      logger.error(err)
      return null
    })

    if (results === null) return res.status(500).json(errorAPIUSER.errorAPIGetAllUsers)

    const apiRes: apiResponseGetAllUserType = { data: results }

    return res.status(200).json(apiRes)
  })
  .post(async (req: Request, res: Response) => {
    const { userId, firstname, lastname } = req.body

    const result = await saveNewUser(userId, firstname, lastname).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIUserCreation)

    const response: apiResponseCreateUserType = { data: result }

    return res.status(200).json(response)
  })

userRouter
  .route("/:userId")
  .get(async (req: Request, res: Response) => {
    const userId = await validateUserIdParams(req.params.userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (userId === null) {
      return res.status(400).json(errorAPIUSER.errorAPIInvalidUserId)
    }

    const result = await getUserWalletInfo(userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIGetUser)

    return res.status(200).json({ data: result } as apiResponseGetUserType)
  })
  .delete(async (req: Request, res: Response) => {
    const userId = await validateUserIdParams(req.params.userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (userId === null) {
      return res.status(400).json(errorAPIUSER.errorAPIInvalidUserId)
    }

    const result = await deleteUserById(userId).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIDeleteUser)

    return res.status(200).json({ data: result } as apiResponseDeleteUserType)
  })

export default userRouter
