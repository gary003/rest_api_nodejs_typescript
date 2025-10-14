import '../../../../bin/tracing'
import { Router, Request, Response } from 'express'
import { deleteUserById, getAllUsers, getAllUsersStream, getUserWalletInfo, saveNewUser, transferMoney } from '../../../services/user/index'

import { errorAPIUSER } from './error.dto'

import logger from '../../../helpers/logger'
import { apiResponseGetAllUserType, apiResponseGetUserType, apiResponseCreateUserType, apiResponseDeleteUserType } from './apiResponse.dto'
import { userWalletDTO } from '../../../services/user/dto'
import { validateUserId } from '../../middlewares/user/user.validation'
import { trace, Span, Tracer, SpanOptions } from '@opentelemetry/api'

const userRouter = Router()

userRouter
  .route('/')
  .get(async (_: Request, res: Response) => {
    const tracer: Tracer = trace.getTracer('route-user')
    const spanOptions: SpanOptions = {
      startTime: Date.now()
    }

    return tracer.startActiveSpan('getAllUsers', spanOptions, async (span: Span) => {
      // Add attributes (tags) to the span
      span.setAttribute('http.route', '/users')
      const { traceId } = span.spanContext()

      logger.info(`route:userAll - traceId : ${traceId}`)

      try {
        const results = await getAllUsers().catch((err) => err)

        if (results instanceof Error) {
          const errInfo = `presentationError: ${errorAPIUSER.errorAPIGetAllUsers.message} \n ${String(results)}`
          logger.error(errInfo)
          return res.status(588).end(errInfo)
        }

        const apiRes: apiResponseGetAllUserType = { data: results as userWalletDTO[] }

        span.end()
        return res.status(200).json(apiRes)
      } catch (err) {
        if (err instanceof Error) span.recordException(String(err))
        span.end()
        const errInfo: string = `route:getAllUsers - Internal Server Error - ${err}`
        return res.status(500).send(errInfo)
      }
    })
  })
  .post(async (req: Request, res: Response) => {
    const { firstname, lastname } = req.body

    const result = await saveNewUser(firstname, lastname).catch((err) => {
      logger.error(err)
      return err
    })

    if (result instanceof Error) {
      const errInfo = `presentationError: ${errorAPIUSER.errorAPIUserCreation?.message} \n ${result.message}`
      return res.status(500).send(errInfo)
    }

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
    const errInfo = `presentationError: ${errorAPIUSER.errorAPIUserTransferNoResults?.message} \n ${result.message}`
    return res.status(500).send(errInfo)
  }

  const response = { data: result }

  return res.status(200).json(response)
})

userRouter.route('/stream').get(async (_: Request, res: Response) => {
  const usersStream = await getAllUsersStream().catch((err) => err)

  if (usersStream instanceof Error) {
    const errInfo = `presentationError: ${errorAPIUSER.errorAPIGetAllUsers?.message} \n ${usersStream.message}`
    return res.status(500).send(errInfo)
  }

  // usersStream.on('data', (d: any) => logger.debug(d))
  return usersStream.pipe(res)
})

userRouter
  .route('/:userId')
  .get(validateUserId, async (req: Request, res: Response) => {
    const result = await getUserWalletInfo(String(req.params.userId)).catch((err) => err)

    if (result instanceof Error) {
      const errInfo = `presentationError: ${errorAPIUSER.errorAPIGetUser.message} \n ${result.message}`
      return res.status(500).send(errInfo)
    }

    return res.status(200).json({ data: result } as apiResponseGetUserType)
  })
  .delete(validateUserId, async (req: Request, res: Response) => {
    const result = await deleteUserById(String(req.params.userId)).catch((err) => err)

    if (result instanceof Error) {
      const errInfo = `presentationError: ${errorAPIUSER.errorAPIDeleteUser?.message} \n ${result.message}`
      return res.status(500).send(errInfo)
    }

    return res.status(200).json({ data: result } as apiResponseDeleteUserType)
  })

export default userRouter
