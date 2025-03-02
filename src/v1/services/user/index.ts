import { acquireLockOnWallet, commitAndQuitTransactionRunner, createAndStartTransaction, rollBackAndQuitTransactionRunner } from '../../infrastructure/database/db_connection/connectionFile'
import { getAllUsersDB, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB, getAllUsersStreamDB } from '../../infrastructure/database/user'
import { updateWalletByWalletIdDB, updateWalletByWalletIdTransaction } from '../../infrastructure/database/wallet'
import { moneyTypes, moneyTypesO } from '../../domain'
import { userWalletDTO } from './dto'
import { transferMoneyErrors, userFunctionsErrors, moneyTransferParamsValidatorErrors, transferMoneyWithRetryErrors } from './error.dto'
import logger from '../../helpers/logger'
import { errorType } from '../../domain/error'

export const getAllUsers = async (): Promise<userWalletDTO[]> => {
  const allUsers = await getAllUsersDB().catch((err) => err)

  if (allUsers instanceof Error) {
    const allUsersError = `serviceError: ${userFunctionsErrors.ErrorRetrievingUser!.message} \n databaseError: ${String(allUsers)}`
    logger.error(allUsersError)
    throw new Error(allUsersError)
  }

  return allUsers as unknown as userWalletDTO[]
}

export const getAllUsersStream = async () => {
  const streamUsers = await getAllUsersStreamDB().catch((err) => err)

  if (streamUsers instanceof Error) {
    const errorStream = `serviceError: ${userFunctionsErrors.ErrorRetrievingUsers!.message} \n databaseError: ${String(streamUsers)}`
    logger.error(errorStream)
    throw new Error(errorStream)
  }

  return streamUsers
}

export const saveNewUser = async (firstname: string, lastname: string): Promise<userWalletDTO> => {
  const newUser = await saveNewUserDB(firstname, lastname).catch((err) => err)

  if (newUser instanceof Error) {
    const saveError = `serviceError: ${userFunctionsErrors.ErrorCreatingUser!.message} \n databaseError: ${String(newUser)}`
    logger.error(saveError)
    throw new Error(saveError)
  }

  return newUser as unknown as userWalletDTO
}

export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  if (amount <= 0) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorInvalidAmount!.message}`)
  if (!Object.values(moneyTypesO).includes(currencyType)) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorCurrencyType!.message}`)

  const currentUserWalletInfo = await getUserWalletInfo(userId).catch((err) => err)

  if (currentUserWalletInfo instanceof Error) {
    const userInfoError = `serviceError: ${userFunctionsErrors.ErrorGettingWalletInfo!.message} \n databaseError: ${String(currentUserWalletInfo)}`
    logger.error(userInfoError)
    throw new Error(userInfoError)
  }

  if (!currentUserWalletInfo.Wallet) {
    logger.error(userFunctionsErrors.ErrorNoWalletUser!.message)
    throw new Error(`serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message}`)
  }

  const resultUpdate = await updateWalletByWalletIdDB(String(currentUserWalletInfo.Wallet.walletId), currencyType, Number(currentUserWalletInfo.Wallet[currencyType]) + amount).catch((err) => err)

  if (resultUpdate instanceof Error) {
    logger.error(userFunctionsErrors.ErrorUpdating!.message)
    logger.error(resultUpdate)
    throw new Error(`serviceError: ${userFunctionsErrors.ErrorUpdating!.message}`)
  }

  return true
}

export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser = await deleteUserByIdDB(userId).catch((err) => err)

  if (deletedUser instanceof Error) {
    const deleteError = `serviceError: ${userFunctionsErrors.ErrorDeletingUser!.message} \n databaseError: ${String(deletedUser)}`
    logger.error(deleteError)
    throw new Error(deleteError)
  }

  return deletedUser
}

export const getUserWalletInfo = async (userId: string): Promise<userWalletDTO> => {
  const userWalletI = await getUserWalletInfoDB(userId).catch((err) => err)

  if (userWalletI instanceof Error) {
    const fetchError = `serviceError: ${userFunctionsErrors.ErrorFetchingUserInfo!.message} \n databaseError: ${String(userWalletI)}`
    logger.error(fetchError)
    throw new Error(fetchError)
  }

  return userWalletI
}

export const transferMoneyParamsValidator = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<userWalletDTO[]> => {
  if (!Object.values(moneyTypesO).includes(currency)) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorCurrencyType!.message}`)

  const giverUserInfo = await getUserWalletInfoDB(giverId).catch((error) => error)

  if (giverUserInfo instanceof Error) {
    const giverUserInfoError = `serviceError: ${moneyTransferParamsValidatorErrors.ErrorUserInfo!.message} \n databaseError: ${String(giverUserInfo)}`
    logger.error(giverUserInfoError)
    throw new Error(giverUserInfoError)
  }

  if (!giverUserInfo.Wallet) {
    const error = `serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message} \n databaseError: ${String(giverUserInfo)}`
    logger.error(error)
    throw new Error(error)
  }

  const giverNewBalance = Number(giverUserInfo.Wallet[currency]) - amount

  if (giverNewBalance < 0) {
    throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorInsufficientFunds!.message}`)
  }

  const recipientUserInfo = await getUserWalletInfoDB(recipientId).catch((error) => error)

  if (recipientUserInfo instanceof Error) {
    const recipientUserInfoError = `serviceError: ${moneyTransferParamsValidatorErrors.ErrorUserInfo!.message} \n databaseError: ${String(recipientUserInfo)}`
    logger.error(recipientUserInfo)
    throw new Error(recipientUserInfoError)
  }

  if (!recipientUserInfo.Wallet) {
    const error = `serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message} \n databaseError: ${String(recipientUserInfo)}`
    logger.error(error)
    throw new Error(error)
  }

  return [giverUserInfo, recipientUserInfo]
}

export const transferMoney = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<boolean> => {
  const res = await transferMoneyParamsValidator(currency, giverId, recipientId, amount).catch((err) => err)

  if (res instanceof Error) {
    const paramError = `serviceError: ${transferMoneyErrors.ErrorParamsValidator!.message} \n databaseError: ${String(res)}`
    logger.error(paramError)
    throw new Error(paramError)
  }

  const [giverUserInfo, recipientUserInfo]: userWalletDTO[] = res

  if (!giverUserInfo || !recipientUserInfo) {
    logger.error(transferMoneyErrors.ErrorParamsValidator!.message)
    throw new Error(`serviceError: ${transferMoneyErrors.ErrorParamsValidator!.message}`)
  }

  // Set the transaction object
  const transacRunner = await createAndStartTransaction().catch((err) => err)

  if (transacRunner instanceof Error) {
    const transacRunnerError = `serviceError: ${transferMoneyErrors.ErrorTransactionCreation!.message} \n databaseError: ${String(transacRunner)}`
    logger.error(transacRunnerError)
    throw new Error(transacRunnerError)
  }

  // Acquire locks on giver and recipient wallets (pessimistic locking)
  const lockResultGiver: boolean = await acquireLockOnWallet(transacRunner, String(giverUserInfo.Wallet.walletId))
  const lockResultRecipient: boolean = await acquireLockOnWallet(transacRunner, String(recipientUserInfo.Wallet.walletId))

  if (!lockResultGiver || !lockResultRecipient) {
    const errorLock = `serviceError: ${transferMoneyErrors.ErrorLockAcquisition!.message}`
    logger.error(errorLock)
    throw new Error(errorLock)
  }

  // Update the giver with new balance
  const giverNewBalance: number = Number(giverUserInfo.Wallet[currency]) - amount

  const updateWalletGiverResult = await updateWalletByWalletIdTransaction(transacRunner, String(giverUserInfo.Wallet.walletId), currency, giverNewBalance).catch((err) => err)

  if (updateWalletGiverResult instanceof Error) {
    const updateError = `serviceError: ${transferMoneyErrors.ErrorUpdateGiverWallet!.message} \n databaseError: ${updateWalletGiverResult.message}`
    logger.error(updateError)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(updateError)
  }

  // Update the recipient with new balance
  const recipientNewBalance: number = Number(recipientUserInfo.Wallet[currency]) + amount

  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, String(recipientUserInfo.Wallet.walletId), currency, recipientNewBalance).catch((err) => err)

  if (updateWalletRecipientResult instanceof Error) {
    const updateWalletRecipientError = `serviceError: ${transferMoneyErrors.ErrorUpdateRecipientWallet!.message} \n databaseError: ${String(updateWalletRecipientResult)}`
    logger.error(updateWalletRecipientError)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(updateWalletRecipientError)
  }

  commitAndQuitTransactionRunner(transacRunner)

  return true
}

export const transferMoneyWithRetry = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number, delayTime = 300, maxRetries = 3, attempt = 1): Promise<boolean> => {
  try {
    return await transferMoney(currency, giverId, recipientId, amount)
  } catch (err) {
    // The transfer fails after the max number of tries allowed
    if (attempt >= maxRetries) {
      logger.error(`Transfer failed - Max retry attempt reached: ${attempt} attempts`)
      throw new Error(`serviceError: ${transferMoneyWithRetryErrors.ErrorMaxRetry!.message} \n maxRetries: ${maxRetries}`)
    }

    const errInfo = err as errorType

    // If the current error is of type retryable, another call is made
    if (!!errInfo && errInfo.message.includes('Error - Lock')) {
      const delay = delayTime * 2 ** (attempt - 1)
      logger.warn(`Transfer failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return transferMoneyWithRetry(currency, giverId, recipientId, amount, delay, maxRetries, attempt + 1)
    }

    // Re-throw non-retryable errors
    logger.error(errInfo.message)
    throw new Error(errInfo.message)
  }
}
