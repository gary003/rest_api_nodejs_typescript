import {
  acquireLockOnWallet,
  commitAndQuitTransactionRunner,
  createAndStartTransaction,
  rollBackAndQuitTransactionRunner
} from '../../infrastructure/database/db_connection/connectionFile'
import { getAllUsersDB, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB, getAllUsersStreamDB } from '../../infrastructure/database/user'
import { updateWalletByWalletIdDB, updateWalletByWalletIdTransaction } from '../../infrastructure/database/wallet'
import { moneyTypes, moneyTypesO } from '../../domain'
import { userWalletDTO } from './dto'
import { transferMoneyErrors, userFunctionsErrors, moneyTransferParamsValidatorErrors, transferMoneyWithRetryErrors } from './error.dto'
import logger from '../../helpers/logger'
import { errorType } from '../../domain/error'

/**
 * Retrieves all users along with their wallet information.
 * @returns {Promise<userWalletDTO[]>} - A list of users with their wallets.
 * @throws {Error} - If the database query fails.
 */
export const getAllUsers = async (): Promise<userWalletDTO[]> => {
  const allUsers = await getAllUsersDB().catch((err) => err)

  if (allUsers instanceof Error) {
    // Log and throw an error if the database query fails
    const allUsersError = `serviceError: ${userFunctionsErrors.ErrorRetrievingUser!.message} \n databaseError: ${String(allUsers)}`
    logger.error(allUsersError)
    throw new Error(allUsersError)
  }

  return allUsers as unknown as userWalletDTO[]
}

/**
 * Retrieves all users as a stream for efficient handling of large datasets.
 * @returns {Promise<ReadableStream>} - A stream of users with their wallets.
 * @throws {Error} - If the database query fails.
 */
export const getAllUsersStream = async () => {
  const streamUsers = await getAllUsersStreamDB().catch((err) => err)

  if (streamUsers instanceof Error) {
    // Log and throw an error if the stream query fails
    const errorStream = `serviceError: ${userFunctionsErrors.ErrorRetrievingUsers!.message} \n databaseError: ${String(streamUsers)}`
    logger.error(errorStream)
    throw new Error(errorStream)
  }

  return streamUsers
}

/**
 * Saves a new user to the database.
 * @param {string} firstname - The first name of the user.
 * @param {string} lastname - The last name of the user.
 * @returns {Promise<userWalletDTO>} - The newly created user.
 * @throws {Error} - If the user creation fails.
 */
export const saveNewUser = async (firstname: string, lastname: string): Promise<userWalletDTO> => {
  const newUser = await saveNewUserDB(firstname, lastname).catch((err) => err)

  if (newUser instanceof Error) {
    // Log and throw an error if user creation fails
    const saveError = `serviceError: ${userFunctionsErrors.ErrorCreatingUser!.message} \n databaseError: ${String(newUser)}`
    logger.error(saveError)
    throw new Error(saveError)
  }

  return newUser as unknown as userWalletDTO
}

/**
 * Adds currency to a user's wallet.
 * @param {string} userId - The ID of the user.
 * @param {moneyTypes} currencyType - The type of currency to add (e.g., hard_currency, soft_currency).
 * @param {number} amount - The amount of currency to add.
 * @returns {Promise<boolean>} - True if the update is successful.
 * @throws {Error} - If the amount is invalid, the currency type is invalid, or the update fails.
 */
export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  // Validate the amount and currency type
  if (amount <= 0) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorInvalidAmount!.message}`)
  if (!Object.values(moneyTypesO).includes(currencyType)) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorCurrencyType!.message}`)

  // Retrieve the user's wallet information
  const currentUserWalletInfo = await getUserWalletInfo(userId).catch((err) => err)

  if (currentUserWalletInfo instanceof Error) {
    // Log and throw an error if the wallet info retrieval fails
    const userInfoError = `serviceError: ${userFunctionsErrors.ErrorGettingWalletInfo!.message} \n databaseError: ${String(currentUserWalletInfo)}`
    logger.error(userInfoError)
    throw new Error(userInfoError)
  }

  // Ensure the user has a wallet
  if (!currentUserWalletInfo.Wallet) {
    logger.error(userFunctionsErrors.ErrorNoWalletUser!.message)
    throw new Error(`serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message}`)
  }

  // Update the wallet with the new balance
  const resultUpdate = await updateWalletByWalletIdDB(
    String(currentUserWalletInfo.Wallet.walletId),
    currencyType,
    Number(currentUserWalletInfo.Wallet[currencyType]) + amount
  ).catch((err) => err)

  if (resultUpdate instanceof Error) {
    // Log and throw an error if the wallet update fails
    logger.error(userFunctionsErrors.ErrorUpdating!.message)
    logger.error(resultUpdate)
    throw new Error(`serviceError: ${userFunctionsErrors.ErrorUpdating!.message}`)
  }

  return true
}

/**
 * Deletes a user by their ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<boolean>} - True if the deletion is successful.
 * @throws {Error} - If the deletion fails.
 */
export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser = await deleteUserByIdDB(userId).catch((err) => err)

  if (deletedUser instanceof Error) {
    // Log and throw an error if the deletion fails
    const deleteError = `serviceError: ${userFunctionsErrors.ErrorDeletingUser!.message} \n databaseError: ${String(deletedUser)}`
    logger.error(deleteError)
    throw new Error(deleteError)
  }

  return deletedUser
}

/**
 * Retrieves a user's wallet information by their ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<userWalletDTO>} - The user's wallet information.
 * @throws {Error} - If the wallet info retrieval fails.
 */
export const getUserWalletInfo = async (userId: string): Promise<userWalletDTO> => {
  const userWalletI = await getUserWalletInfoDB(userId).catch((err) => err)

  if (userWalletI instanceof Error) {
    // Log and throw an error if the wallet info retrieval fails
    const fetchError = `serviceError: ${userFunctionsErrors.ErrorFetchingUserInfo!.message} \n databaseError: ${String(userWalletI)}`
    logger.error(fetchError)
    throw new Error(fetchError)
  }

  return userWalletI
}

/**
 * Validates the parameters for a money transfer.
 * @param {moneyTypes} currency - The type of currency to transfer.
 * @param {string} giverId - The ID of the user sending the money.
 * @param {string} recipientId - The ID of the user receiving the money.
 * @param {number} amount - The amount of money to transfer.
 * @returns {Promise<userWalletDTO[]>} - The wallet information for both the giver and recipient.
 * @throws {Error} - If the parameters are invalid or the wallet info retrieval fails.
 */
export const transferMoneyParamsValidator = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<userWalletDTO[]> => {
  // Validate the currency type
  if (!Object.values(moneyTypesO).includes(currency)) throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorCurrencyType!.message}`)

  // Retrieve the giver's wallet information
  const giverUserInfo = await getUserWalletInfoDB(giverId).catch((error) => error)

  if (giverUserInfo instanceof Error) {
    // Log and throw an error if the giver's wallet info retrieval fails
    const giverUserInfoError = `serviceError: ${moneyTransferParamsValidatorErrors.ErrorUserInfo!.message} \n databaseError: ${String(giverUserInfo)}`
    logger.error(giverUserInfoError)
    throw new Error(giverUserInfoError)
  }

  // Ensure the giver has a wallet
  if (!giverUserInfo.Wallet) {
    const error = `serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message} \n databaseError: ${String(giverUserInfo)}`
    logger.error(error)
    throw new Error(error)
  }

  // Calculate the giver's new balance after the transfer
  const giverNewBalance = Number(giverUserInfo.Wallet[currency]) - amount

  // Ensure the giver has sufficient funds
  if (giverNewBalance < 0) {
    throw new Error(`serviceError: ${moneyTransferParamsValidatorErrors.ErrorInsufficientFunds!.message}`)
  }

  // Retrieve the recipient's wallet information
  const recipientUserInfo = await getUserWalletInfoDB(recipientId).catch((error) => error)

  if (recipientUserInfo instanceof Error) {
    // Log and throw an error if the recipient's wallet info retrieval fails
    const recipientUserInfoError = `serviceError: ${moneyTransferParamsValidatorErrors.ErrorUserInfo!.message} \n databaseError: ${String(recipientUserInfo)}`
    logger.error(recipientUserInfo)
    throw new Error(recipientUserInfoError)
  }

  // Ensure the recipient has a wallet
  if (!recipientUserInfo.Wallet) {
    const error = `serviceError: ${userFunctionsErrors.ErrorNoWalletUser!.message} \n databaseError: ${String(recipientUserInfo)}`
    logger.error(error)
    throw new Error(error)
  }

  return [giverUserInfo, recipientUserInfo]
}

/**
 * Transfers money between two users' wallets.
 * @param {moneyTypes} currency - The type of currency to transfer.
 * @param {string} giverId - The ID of the user sending the money.
 * @param {string} recipientId - The ID of the user receiving the money.
 * @param {number} amount - The amount of money to transfer.
 * @returns {Promise<boolean>} - True if the transfer is successful.
 * @throws {Error} - If the transfer fails at any step.
 */
export const transferMoney = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number): Promise<boolean> => {
  // Validate the transfer parameters
  const res = await transferMoneyParamsValidator(currency, giverId, recipientId, amount).catch((err) => err)

  if (res instanceof Error) {
    // Log and throw an error if the parameter validation fails
    const paramError = `serviceError: ${transferMoneyErrors.ErrorParamsValidator!.message} \n databaseError: ${String(res)}`
    logger.error(paramError)
    throw new Error(paramError)
  }

  const [giverUserInfo, recipientUserInfo]: userWalletDTO[] = res

  if (!giverUserInfo || !recipientUserInfo) {
    // Log and throw an error if the giver or recipient info is missing
    logger.error(transferMoneyErrors.ErrorParamsValidator!.message)
    throw new Error(`serviceError: ${transferMoneyErrors.ErrorParamsValidator!.message}`)
  }

  // Start a database transaction
  const transacRunner = await createAndStartTransaction().catch((err) => err)

  if (transacRunner instanceof Error) {
    // Log and throw an error if the transaction creation fails
    const transacRunnerError = `serviceError: ${transferMoneyErrors.ErrorTransactionCreation!.message} \n databaseError: ${String(transacRunner)}`
    logger.error(transacRunnerError)
    throw new Error(transacRunnerError)
  }

  // Acquire locks on the giver and recipient wallets to prevent concurrent updates
  const lockResultGiver: boolean = await acquireLockOnWallet(transacRunner, String(giverUserInfo.Wallet.walletId))
  const lockResultRecipient: boolean = await acquireLockOnWallet(transacRunner, String(recipientUserInfo.Wallet.walletId))

  if (!lockResultGiver || !lockResultRecipient) {
    // Log and throw an error if the lock acquisition fails
    const errorLock = `serviceError: ${transferMoneyErrors.ErrorLockAcquisition!.message}`
    logger.error(errorLock)
    throw new Error(errorLock)
  }

  // Update the giver's wallet with the new balance
  const giverNewBalance: number = Number(giverUserInfo.Wallet[currency]) - amount

  const updateWalletGiverResult = await updateWalletByWalletIdTransaction(transacRunner, String(giverUserInfo.Wallet.walletId), currency, giverNewBalance).catch((err) => err)

  if (updateWalletGiverResult instanceof Error) {
    // Log and throw an error if the giver's wallet update fails
    const updateError = `serviceError: ${transferMoneyErrors.ErrorUpdateGiverWallet!.message} \n databaseError: ${updateWalletGiverResult.message}`
    logger.error(updateError)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(updateError)
  }

  // Update the recipient's wallet with the new balance
  const recipientNewBalance: number = Number(recipientUserInfo.Wallet[currency]) + amount

  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, String(recipientUserInfo.Wallet.walletId), currency, recipientNewBalance).catch(
    (err) => err
  )

  if (updateWalletRecipientResult instanceof Error) {
    // Log and throw an error if the recipient's wallet update fails
    const updateWalletRecipientError = `serviceError: ${transferMoneyErrors.ErrorUpdateRecipientWallet!.message} \n databaseError: ${String(updateWalletRecipientResult)}`
    logger.error(updateWalletRecipientError)
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error(updateWalletRecipientError)
  }

  // Commit the transaction if everything is successful
  commitAndQuitTransactionRunner(transacRunner)

  return true
}

/**
 * Transfers money between two users' wallets with retry logic for transient errors.
 * @param {moneyTypes} currency - The type of currency to transfer.
 * @param {string} giverId - The ID of the user sending the money.
 * @param {string} recipientId - The ID of the user receiving the money.
 * @param {number} amount - The amount of money to transfer.
 * @param {number} delayTime - The initial delay between retries (in milliseconds).
 * @param {number} maxRetries - The maximum number of retry attempts.
 * @param {number} attempt - The current retry attempt.
 * @returns {Promise<boolean>} - True if the transfer is successful.
 * @throws {Error} - If the transfer fails after the maximum number of retries.
 */
export const transferMoneyWithRetry = async (
  currency: moneyTypes,
  giverId: string,
  recipientId: string,
  amount: number,
  delayTime = 300,
  maxRetries = 3,
  attempt = 1
): Promise<boolean> => {
  try {
    // Attempt the transfer
    return await transferMoney(currency, giverId, recipientId, amount)
  } catch (err) {
    // Stop retrying if the maximum number of attempts is reached
    if (attempt >= maxRetries) {
      logger.error(`Transfer failed - Max retry attempt reached: ${attempt} attempts`)
      throw new Error(`serviceError: ${transferMoneyWithRetryErrors.ErrorMaxRetry!.message} \n maxRetries: ${maxRetries}`)
    }

    const errInfo = err as errorType

    // Retry if the error is related to a lock (transient error)
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
