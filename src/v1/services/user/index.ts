import { acquireLockOnWallet, commitAndQuitTransactionRunner, createAndStartTransaction, rollBackAndQuitTransactionRunner } from "../../dataServices/typeorm/connection/connectionFile"
import { getAllDBUsers, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB } from "../../dataServices/typeorm/user"
import { updateWalletByWalletId, updateWalletByWalletIdTransaction } from "../../dataServices/typeorm/wallet"
import { moneyTypes } from "../../domain"
import { userWalletDTO } from "./dto"
import logger from "../../helpers/logger"

export const getAllUsers = async (): Promise<userWalletDTO[]> => {
  const allUsers: userWalletDTO[] = (await getAllDBUsers().catch((err) => {
    logger.error(err)
    return err
  })) as unknown as userWalletDTO[]

  if (!allUsers) throw new Error("Impossible to retreive any user")

  return allUsers
}

export const saveNewUser = async (userId: string, firstname: string, lastname: string): Promise<userWalletDTO> => {
  const newUser: userWalletDTO = (await saveNewUserDB(userId, firstname, lastname).catch((err) => {
    logger.error(err)
    return err
  })) as unknown as userWalletDTO

  if (!newUser) throw new Error("Impossible to save the new user")

  return newUser
}

export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  if (amount <= 0) throw new Error("The amount to add must be at least equal to 1")
  if (!Object.values(moneyTypes).includes(currencyType)) throw new Error("Wrong type of currency")

  const currentUserWalletInfo: userWalletDTO = await getUserWalletInfo(userId)

  const resultUpdate = await updateWalletByWalletId(String(currentUserWalletInfo.Wallet.walletId), currencyType, currentUserWalletInfo[currencyType] + amount).catch((err) => {
    logger.error(err)
    return err
  })

  if (!resultUpdate) throw new Error("Impossible to update wallet")

  return true
}

export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser: boolean = await deleteUserByIdDB(userId)

  if (!deletedUser) throw new Error("Impossible to delete the user")

  return deletedUser
}

export const getUserWalletInfo = async (userId: string): Promise<userWalletDTO> => {
  const userWalletI = (await getUserWalletInfoDB(userId)) as userWalletDTO

  if (!userWalletI) throw new Error("No user found !")

  return userWalletI
}

export const transferMoneyParamsValidator = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number) => {
  if (!Object.values(moneyTypes).includes(currency)) throw new Error("wrong type of currency")

  const giverUserInfo: any = await getUserWalletInfoDB(giverId)

  const giverNewBalance = Number(giverUserInfo.Wallet[currency]) - amount

  if (giverNewBalance < 0) throw new Error("Not enough funds to make transaction")

  const recipientUserInfo: any = await getUserWalletInfoDB(recipientId)

  // logger.debug(JSON.stringify({ giverUserInfo, giverNewBalance }))

  return [giverUserInfo, recipientUserInfo]
}

export const transferMoney = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number) => {
  const [giverUserInfo, recipientUserInfo] = await transferMoneyParamsValidator(currency, giverId, recipientId, amount)

  // logger.debug(JSON.stringify([giverUserInfo, recipientUserInfo]))

  const transacRunner = await createAndStartTransaction().catch((err) => err)

  if (!transacRunner) throw new Error("Impossible to create transaction")

  // Acquire locks on giver and recipient wallets (pessimistic locking)
  const lockResultGiver = await acquireLockOnWallet(transacRunner, giverUserInfo.Wallet.walletId)
  const lockResultRecipient = await acquireLockOnWallet(transacRunner, recipientUserInfo.Wallet.walletId)

  logger.debug({ lockResultGiver, lockResultRecipient })

  if (!lockResultGiver || !lockResultRecipient) {
    const errorLock = "Error - Lock - Failed to acquire locks on wallets"
    logger.error(errorLock)
    throw new Error(errorLock)
  }

  const giverNewBalance: number = Number(giverUserInfo.Wallet[currency]) - amount

  const updateWalletGiverResult = await updateWalletByWalletIdTransaction(transacRunner, giverUserInfo.Wallet.walletId, currency, giverNewBalance).catch((err) => {
    logger.error(err)
    return err
  })

  logger.debug(JSON.stringify(updateWalletGiverResult))

  if (!updateWalletGiverResult || updateWalletGiverResult[0] === 0) {
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error("Impossible to update the giver wallet info")
  }

  // @ts-ignore
  const recipientNewBalance: number = Number(recipientUserInfo.Wallet[currency]) + amount
  logger.debug(JSON.stringify({ recipientUserInfo, recipientNewBalance }))

  // @ts-ignore
  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, recipientUserInfo.Wallet.walletId, currency, recipientNewBalance).catch((err) => {
    logger.error(err)
    return err
  })

  logger.debug(JSON.stringify(updateWalletRecipientResult))

  if (updateWalletRecipientResult[0] === 0) {
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error("Impossible to update the recipient wallet info")
  }

  commitAndQuitTransactionRunner(transacRunner)

  return true
}

export const transferMoneyWithRetry = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number, delayTime = 300, maxRetries = 3, attempt = 1) => {
  while (attempt <= maxRetries) {
    try {
      // Call your actual transfer money function here (replace with your implementation)
      return await transferMoney(currency, giverId, recipientId, amount)
    } catch (err) {
      // Check for retryable errors (adapt based on your specific error types)
      if (attempt >= maxRetries) {
        throw new Error("Max retry attempt reached: " + attempt + " attempts") // Re-throw non-retryable errors
      } else if (err.message.includes("Error - Lock")) {
        const delay = delayTime ** (attempt - 1)
        logger.warn(`Transfer failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        attempt += 1
      } else {
        throw new Error(err) // Re-throw non-retryable errors
      }
    }
  }

  throw new Error("Error - Should never happen")
}
