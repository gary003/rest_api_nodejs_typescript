import { acquireLockOnWallet, commitAndQuitTransactionRunner, createAndStartTransaction, rollBackAndQuitTransactionRunner } from "../../../infrastructure/persistance/connection/connectionFile"
import { getAllDBUsers, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB } from "../../../infrastructure/persistance/user"
import { updateWalletByWalletIdDB, updateWalletByWalletIdTransaction } from "../../../infrastructure/persistance/wallet"
import { moneyTypes } from "../../../domain"
import { userWalletDTO } from "./dto"
import { transferMoneyErrors, userFunctionsErrors, moneyTransferParamsValidatorErrors, transferMoneyWithRetryErrors, errorType } from "./error.dto"
import logger from "../../../infrastructure/logger"
import { userInfo } from "../../../infrastructure/persistance/user/dto"

export const getAllUsers = async (): Promise<userWalletDTO[]> => {
  const allUsers = await getAllDBUsers().catch((err) => {
    logger.error(err)
    return null
  })

  if (!allUsers) throw new Error(JSON.stringify(userFunctionsErrors.ErrorRetrievingUsers))

  return allUsers as unknown as userWalletDTO[]
}

export const saveNewUser = async (userId: string, firstname: string, lastname: string): Promise<userInfo> => {
  const newUser = await saveNewUserDB(userId, firstname, lastname).catch((err) => {
    logger.error(err)
    return null
  })

  if (!newUser) throw new Error(JSON.stringify(userFunctionsErrors.ErrorCreatingUser))

  return newUser as unknown as userInfo
}

export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  if (amount <= 0) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorInvalidAmount))
  if (!Object.values(moneyTypes).includes(currencyType)) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.currencyTypeError))

  const currentUserWalletInfo = (await getUserWalletInfo(userId).catch((err) => {
    logger.error(err)
    return null
  })) as unknown as userWalletDTO

  if (!currentUserWalletInfo) {
    logger.error(userFunctionsErrors.ErrorGettingWalletInfo)
    throw new Error(JSON.stringify(userFunctionsErrors.ErrorGettingWalletInfo))
  }

  if (!currentUserWalletInfo.Wallet) {
    logger.error(userFunctionsErrors.ErrorNoWalletUser)
    throw new Error(JSON.stringify(userFunctionsErrors.ErrorNoWalletUser))
  }

  const resultUpdate = await updateWalletByWalletIdDB(String(currentUserWalletInfo.Wallet?.walletId), currencyType, Number(currentUserWalletInfo.Wallet[currencyType]) + amount).catch((err) => {
    logger.error(err)
    return null
  })

  if (!resultUpdate) throw new Error(JSON.stringify(userFunctionsErrors.ErrorUpdatingWallet))

  return true
}

export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser: boolean | null = await deleteUserByIdDB(userId).catch((err) => {
    logger.error(err)
    return null
  })

  if (!deletedUser) throw new Error(JSON.stringify(userFunctionsErrors.ErrorDeletingUser))

  return deletedUser
}

export const getUserWalletInfo = async (userId: string): Promise<userInfo> => {
  const userWalletI = await getUserWalletInfoDB(userId).catch((err) => {
    logger.error(err)
    return null
  })

  if (!userWalletI) throw new Error(JSON.stringify(userFunctionsErrors.ErrorFetchingUserInfo))

  return userWalletI
}

export const transferMoneyParamsValidator = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<userInfo[]> => {
  if (!Object.values(moneyTypes).includes(currency)) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorCurrencyType))

  const giverUserInfo: any = await getUserWalletInfoDB(giverId).catch((err) => {
    return false
  })

  if (!giverUserInfo) {
    throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorUserInfo))
  }

  const giverNewBalance = Number(giverUserInfo.Wallet[currency]) - amount

  if (giverNewBalance < 0) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorInsufficientFunds))

  const recipientUserInfo: any = await getUserWalletInfoDB(recipientId).catch((err) => {
    return false
  })

  if (!recipientUserInfo) {
    throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorUserInfo))
  }

  // logger.debug(JSON.stringify({ giverUserInfo, giverNewBalance }))

  return [giverUserInfo, recipientUserInfo]
}

export const transferMoney = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<boolean> => {
  const [giverUserInfo, recipientUserInfo]: any = await transferMoneyParamsValidator(currency, giverId, recipientId, amount).catch((err) => {
    logger.error(err)
    return null
  })

  if (!giverUserInfo || !recipientUserInfo) {
    logger.error(transferMoneyErrors.ErrorParamsValidator)
    throw new Error(JSON.stringify(transferMoneyErrors.ErrorParamsValidator)) // Use pre-defined error
  }

  const transacRunner = await createAndStartTransaction().catch((err) => {
    logger.error(err)
    return null
  })

  if (!transacRunner) {
    logger.error(transferMoneyErrors.ErrorTransactionCreation)
    throw new Error(JSON.stringify(transferMoneyErrors.ErrorTransactionCreation)) // Use pre-defined error
  }

  // Acquire locks on giver and recipient wallets (pessimistic locking)
  const lockResultGiver = await acquireLockOnWallet(transacRunner, String(giverUserInfo.Wallet.walletId))
  const lockResultRecipient = await acquireLockOnWallet(transacRunner, String(recipientUserInfo.Wallet.walletId))

  if (!lockResultGiver || !lockResultRecipient) {
    const errorLock = transferMoneyErrors.ErrorLockAcquisition
    logger.error(errorLock)
    throw new Error(JSON.stringify(errorLock))
  }

  const giverNewBalance: number = Number(giverUserInfo.Wallet[currency]) - amount

  const updateWalletGiverResult = await updateWalletByWalletIdTransaction(transacRunner, String(giverUserInfo.Wallet.walletId), currency, giverNewBalance).catch((err) => {
    logger.error(err)
    return null
  })

  if (!updateWalletGiverResult) {
    logger.error(transferMoneyErrors.ErrorUpdateGiverWallet)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(JSON.stringify(transferMoneyErrors.ErrorUpdateGiverWallet))
  }

  const recipientNewBalance: number = Number(recipientUserInfo.Wallet[currency]) + amount

  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, String(recipientUserInfo.Wallet.walletId), currency, recipientNewBalance).catch((err) => {
    logger.error(err)
    return null
  })

  if (!updateWalletRecipientResult) {
    logger.error(transferMoneyErrors.ErrorUpdateRecipientWallet)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(JSON.stringify(transferMoneyErrors.ErrorUpdateRecipientWallet))
  }

  commitAndQuitTransactionRunner(transacRunner)

  return true
}

export const transferMoneyWithRetry = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number, delayTime = 300, maxRetries = 3, attempt = 1): Promise<boolean> => {
  try {
    return await transferMoney(currency, giverId, recipientId, amount)
  } catch (err) {
    const errInfo = err as errorType
    if (attempt >= maxRetries) {
      logger.warn(`Transfer failed - Max retry attempt reached: ${attempt} attempts`)
      throw new Error(JSON.stringify({ ...transferMoneyWithRetryErrors.ErrorMaxRetry, maxRetries }))
    } else if (!!errInfo && errInfo.message.includes("Error - Lock")) {
      const delay = delayTime * 2 ** (attempt - 1)
      logger.warn(`Transfer failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return transferMoneyWithRetry(currency, giverId, recipientId, amount, delay, maxRetries, attempt + 1)
    } else {
      throw new Error(errInfo.message) // Re-throw non-retryable errors
    }
  }
}
