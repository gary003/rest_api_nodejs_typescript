import { acquireLockOnWallet, commitAndQuitTransactionRunner, createAndStartTransaction, rollBackAndQuitTransactionRunner } from "../../../infrastructure/persistance/connection/connectionFile"
import { getAllDBUsers, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB } from "../../../infrastructure/persistance/user"
import { updateWalletByWalletIdDB, updateWalletByWalletIdTransaction } from "../../../infrastructure/persistance/wallet"
import { moneyTypes } from "../../../domain"
import { userWalletDTO } from "./dto"
import { transferMoneyErrors, userFunctionsErrors, moneyTransferParamsValidatorErrors, transferMoneyWithRetryErrors } from "./error.dto"
import logger from "../../../infrastructure/logger"
import { userInfo } from "../../../infrastructure/persistance/user/dto"

export const getAllUsers = async (): Promise<userWalletDTO[]> => {
  const allUsers: userWalletDTO[] = await getAllDBUsers().catch((err) => {
    logger.error(err)
    return null
  })

  if (!allUsers) throw new Error(JSON.stringify(userFunctionsErrors.ErrorRetrievingUsers))

  return allUsers
}

export const saveNewUser = async (userId: string, firstname: string, lastname: string): Promise<userWalletDTO> => {
  const newUser: userWalletDTO = await saveNewUserDB(userId, firstname, lastname).catch((err) => {
    logger.error(err)
    return null
  })

  if (!newUser) throw new Error(JSON.stringify(userFunctionsErrors.ErrorCreatingUser))

  return newUser
}

export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  if (amount <= 0) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.ErrorInvalidAmount))
  if (!Object.values(moneyTypes).includes(currencyType)) throw new Error(JSON.stringify(moneyTransferParamsValidatorErrors.currencyTypeError))

  const currentUserWalletInfo: userWalletDTO = await getUserWalletInfo(userId).catch((err) => {
    logger.error(err)
    return null
  })

  const resultUpdate = await updateWalletByWalletIdDB(String(currentUserWalletInfo.Wallet.walletId), currencyType, currentUserWalletInfo[currencyType] + amount).catch((err) => {
    logger.error(err)
    return null
  })

  if (!resultUpdate) throw new Error(JSON.stringify(userFunctionsErrors.ErrorUpdatingWallet))

  return true
}

export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser: boolean = await deleteUserByIdDB(userId).catch((err) => {
    logger.error(err)
    return null
  })

  if (!deletedUser) throw new Error(JSON.stringify(userFunctionsErrors.ErrorDeletingUser))

  return deletedUser
}

export const getUserWalletInfo = async (userId: string): Promise<userWalletDTO> => {
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
  const [giverUserInfo, recipientUserInfo] = await transferMoneyParamsValidator(currency, giverId, recipientId, amount)

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

  if (!updateWalletGiverResult || updateWalletGiverResult[0] === 0) {
    logger.error(transferMoneyErrors.ErrorUpdateGiverWallet)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(JSON.stringify(transferMoneyErrors.ErrorUpdateGiverWallet))
  }

  const recipientNewBalance: number = Number(recipientUserInfo.Wallet[currency]) + amount

  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, String(recipientUserInfo.Wallet.walletId), currency, recipientNewBalance).catch((err) => {
    logger.error(err)
    return null
  })

  if (!updateWalletRecipientResult || updateWalletRecipientResult[0] === 0) {
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
    if (attempt >= maxRetries) {
      logger.warn(`Transfer failed - Max retry attempt reached: ${attempt} attempts`)
      throw new Error(JSON.stringify({ ...transferMoneyWithRetryErrors.ErrorMaxRetry, maxRetries }))
    } else if (err.message.includes("Error - Lock")) {
      const delay = delayTime * 2 ** (attempt - 1)
      logger.warn(`Transfer failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return transferMoneyWithRetry(currency, giverId, recipientId, amount, delay, maxRetries, attempt + 1)
    } else {
      throw new Error(err) // Re-throw non-retryable errors
    }
  }
}
