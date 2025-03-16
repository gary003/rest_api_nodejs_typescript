import { Wallet } from '../wallet/entity'
import { createAndStartTransaction, getConnection } from '../db_connection/connectionFile'
import { User } from './entity'
import { createNewWalletDB, deleteWalletByIdDBTransaction } from '../wallet'
import { Readable } from 'stream'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import logger from '../../../../helpers/logger'
import { userWalletDBDTO } from './userWalletDB.dto'
import { v4 as uuidv4 } from 'uuid'

// Get all users with their wallets from the database
export const getAllUsersDB = async (): Promise<userWalletDBDTO[]> => {
  const connection = await getConnection() // Get DB connection
  const UserRepository = connection.getRepository(User) // Get User repository

  // Query to fetch all users with their wallets
  const result = await UserRepository.createQueryBuilder('user')
    .innerJoinAndMapOne('user.Wallet', Wallet, 'wallet', 'wallet.userId = user.userId')
    .getMany()
    .catch((err) => err)

  // Handle errors during query execution
  if (result instanceof Error) {
    logger.error(result)
    throw new Error(`Impossible to retrieve any user - ${result.message}`)
  }

  return result as userWalletDBDTO[] // Return users with wallets
}

// Adapts a database stream into a generator yielding JSON strings of user data
export const userStreamAdaptor = async function* (source: ReadStream): AsyncGenerator<string> {
  try {
    // Process each chunk in the stream
    for await (const chunk of source) {
      // Map chunk to userWalletDBDTO format
      const adaptedData: userWalletDBDTO = {
        userId: chunk.user_userId,
        firstname: chunk.user_firstname,
        lastname: chunk.user_lastname,
        Wallet: {
          walletId: chunk.wallet_walletId,
          hardCurrency: chunk.wallet_hardCurrency,
          softCurrency: chunk.wallet_softCurrency
        }
      }

      yield JSON.stringify(adaptedData) + '\n' // Yield JSON string
    }
  } catch (err) {
    logger.error(err) // Log stream processing errors
    throw new Error(`Stream Adaptor error - ${String(err)}`)
  }
}

// Get all users as a stream for efficient handling of large datasets
export const getAllUsersStreamDB = async (): Promise<Readable> => {
  const connection = await getConnection() // Get DB connection
  const UserRepository = connection.getRepository(User) // Get User repository

  // Query to stream users with their wallets
  const userStream = await UserRepository.createQueryBuilder('user').innerJoinAndMapOne('user.Wallet', Wallet, 'wallet', 'wallet.userId = user.userId').stream()

  // Convert generator to a readable stream
  const readableStream = Readable.from(userStreamAdaptor(userStream), {
    objectMode: true
  })

  return readableStream
}

// Save a new user to the database and create a wallet for them
export const saveNewUserDB = async (firstname: string, lastname: string): Promise<User> => {
  const newUser = new User() // Create new user entity
  newUser.userId = uuidv4() // Generate unique ID
  newUser.firstname = firstname
  newUser.lastname = lastname

  // Create a wallet for the new user
  const walletCreation = await createNewWalletDB(newUser).catch((err) => err)

  // Handle wallet creation errors
  if (walletCreation instanceof Error) {
    logger.error(walletCreation)
    throw new Error(`Impossible to create a new wallet or user - ${String(walletCreation)}`)
  }

  return newUser // Return the new user
}

// Delete a user and their associated wallet from the database
export const deleteUserByIdDB = async (userId: string): Promise<boolean> => {
  // Step 1: Get user info
  const userToDeleteInfo = await getUserWalletInfoDB(userId).catch((err) => err)

  // Handle errors during user info retrieval
  if (userToDeleteInfo instanceof Error) {
    logger.error(userToDeleteInfo)
    throw new Error(`Impossible to delete the user in DB, no user info available (step 1) - ${String(userToDeleteInfo)}`)
  }

  // Start a transaction
  const queryRunner = await createAndStartTransaction()

  // Step 2: Delete the wallet if it exists
  if (userToDeleteInfo.Wallet) {
    const walletDeletion = await deleteWalletByIdDBTransaction(queryRunner, String(userToDeleteInfo.Wallet.walletId)).catch((err) => err)

    // Handle wallet deletion errors
    if (walletDeletion instanceof Error) {
      logger.error(walletDeletion)
      await queryRunner.rollbackTransaction() // Rollback on failure
      throw new Error(`Impossible to delete the user in DB (step 2) - ${String(walletDeletion)}`)
    }
  }

  // Step 3: Delete the user
  const UserRepository = queryRunner.manager.getRepository(User)
  const deletedUser = await UserRepository.delete(userId).catch((err) => err)

  // Handle user deletion errors
  if (deletedUser instanceof Error || deletedUser.affected === 0) {
    logger.error(deletedUser)
    await queryRunner.rollbackTransaction() // Rollback on failure
    throw new Error(`Impossible to delete the user in DB (step 3) - ${deletedUser.message}`)
  }

  // Commit the transaction
  await queryRunner.commitTransaction()

  // Release the query runner
  await queryRunner.release()

  return true // Return success
}

// Get a user's wallet info by their ID
export const getUserWalletInfoDB = async (userId: string): Promise<userWalletDBDTO> => {
  const connection = await getConnection() // Get DB connection
  const UserRepository = connection.getRepository(User) // Get User repository

  // Query to fetch user's wallet info
  const userWalletInfo = await UserRepository.createQueryBuilder('user')
    .innerJoinAndMapOne('user.Wallet', Wallet, 'wallets', 'wallets.userId = user.userId')
    .where('user.userId = :userId', { userId: userId })
    .getOne()
    .catch((err) => err)

  // Handle query errors
  if (userWalletInfo instanceof Error) {
    logger.error(userWalletInfo)
    throw new Error(`Impossible to get the user info - ${userWalletInfo.message}`)
  }

  // Handle case where user doesn't exist
  if (userWalletInfo == null) {
    throw new Error('Impossible to get any user with that ID (response is null - user doesnt exist)')
  }

  return userWalletInfo as userWalletDBDTO // Return user's wallet info
}
