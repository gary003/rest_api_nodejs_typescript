import { Router, Request, Response } from 'express'
import { deleteUserById, getAllUsers, getAllUsersStream, getUserWalletInfo, saveNewUser, transferMoney } from '../../services/user/index'

import { errorAPIUSER } from './error.dto'

import logger from '../../../helpers/logger'
import { validateUserIdParams } from './validation'
import { apiResponseGetAllUserType, apiResponseGetUserType, apiResponseCreateUserType, apiResponseDeleteUserType } from './apiResponse.dto'
import { userWalletDTO } from '../../services/user/dto'

const userRouter = Router()

userRouter
  .route('/')
  .get(async (_: Request, res: Response) => {
    const results = await getAllUsers().catch((err) => err)

    if (results instanceof Error) {
      return res.status(500).json(errorAPIUSER.errorAPIGetAllUsers)
    }

    const apiRes: apiResponseGetAllUserType = { data: results as userWalletDTO[] }

    return res.status(200).json(apiRes)
  })
  .post(async (req: Request, res: Response) => {
    const { firstname, lastname } = req.body

    const result = await saveNewUser(firstname, lastname).catch((err) => {
      logger.error(err)
      return null
    })

    if (result === null) return res.status(500).json(errorAPIUSER.errorAPIUserCreation)

    const response: apiResponseCreateUserType = { data: result }

    return res.status(200).json(response)
  })

// New route for transferring money
userRouter.route('/transfer').post(async (req: Request, res: Response) => {
  const { senderId, receiverId, amount, currency } = req.body

  // Validate required fields
  if (!senderId || !receiverId || !amount || !currency) {
    return res.status(400).json(errorAPIUSER.errorAPIUserTransfertWrongParams)
  }

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(498).json(errorAPIUSER.errorAPIUserTransferIllegalAmount)
  }

  if (senderId === receiverId) {
    return res.status(404).json(errorAPIUSER.errorAPIUserTransferSelf)
  }

  // Call the transferMoney service
  const result = await transferMoney(currency, senderId, receiverId, amount).catch((err) => {
    logger.error(err)
    return err
  })

  if (result instanceof Error) {
    return res.status(500).json({ ...errorAPIUSER.errorAPIUserTransferNoResults, error: JSON.parse(result.message) })
  }

  const response = { data: result }

  return res.status(200).json(response)
})

userRouter.route('/stream').get(async (_: Request, res: Response) => {
  const usersStream = await getAllUsersStream().catch((err) => err)

  if (usersStream instanceof Error) {
    return res.status(500).json({ ...errorAPIUSER.errorAPIGetAllUsers, error: JSON.parse(usersStream.message) })
  }

  // usersStream.on('data', (d: any) => logger.debug(d))
  return usersStream.pipe(res)
})

userRouter
  .route('/:userId')
  .get(validateUserIdParams, async (req: Request, res: Response) => {
    const result = await getUserWalletInfo(String(req.params.userId)).catch((err) => err)

    if (result instanceof Error) {
      const errorMessage = JSON.parse(result.message)
      return res.status(500).json(errorMessage)
    }

    return res.status(200).json({ data: result } as apiResponseGetUserType)
  })
  .delete(validateUserIdParams, async (req: Request, res: Response) => {
    const result = await deleteUserById(String(req.params.userId)).catch((err) => err)

    if (result instanceof Error) return res.status(500).json(errorAPIUSER.errorAPIDeleteUser)

    return res.status(200).json({ data: result } as apiResponseDeleteUserType)
  })

export default userRouter
