import { Router, Request, Response } from "express"
import { deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser } from "../../services/user/index"

import { errorAPIUSER } from "./error.dto"

import logger from "../../../helpers/logger"
import { validateUserIdParams } from "./validation"
import { apiResponseGetAllUserType, apiResponseGetUserType, apiResponseCreateUserType, apiResponseDeleteUserType } from "./apiResponse.dto"
import { userInfo } from "../../../infrastructure/persistance/user/dto"

const userRouter = Router()

userRouter
  .route("/")
  .get(async (_: Request, res: Response) => {
    const results = await getAllUsers().catch((err) => {
      logger.error(err)
      return null
    })

    if (results === null) return res.status(500).json(errorAPIUSER.errorAPIGetAllUsers)

    const apiRes: apiResponseGetAllUserType = { data: results as userInfo[]}

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
  .get(validateUserIdParams, async (req: Request, res: Response) => {
    const result = await getUserWalletInfo(String(req.params.userId)).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIGetUser)

    return res.status(200).json({ data: result } as apiResponseGetUserType)
  })
  .delete(validateUserIdParams, async (req: Request, res: Response) => {
    const result = await deleteUserById(String(req.params.userId)).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIDeleteUser)

    return res.status(200).json({ data: result } as apiResponseDeleteUserType)
  })

export default userRouter
