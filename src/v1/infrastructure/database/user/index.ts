import { Wallet } from '../wallet/entity'
import { createAndStartTransaction, getConnection } from '../db_connection/connectionFile'
import { User } from './entity'
import { createNewWalletDB, deleteWalletByIdDBTransaction } from '../wallet'
import { Readable } from 'stream'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import logger from '../../../helpers/logger'
import { userWalletDBDTO } from './userWalletDB.dto'
import { v4 as uuidv4 } from 'uuid'

export const getAllUsersDB = async (): Promise<userWalletDBDTO[]> => {
  const connection = await getConnection()

  const UserRepository = connection.getRepository(User)

  const result = await UserRepository.createQueryBuilder('user')
    .innerJoinAndMapOne('user.Wallet', Wallet, 'wallet', 'wallet.userId = user.userId')
    .getMany()
    .catch((err) => err)

  if (result instanceof Error) {
    logger.error(result)
    throw new Error(`Impossible to retreive any user - ${result.message}`)
  }

  // logger.debug(JSON.stringify(result))

  return result as userWalletDBDTO[]
}

export const userStreamAdaptor = async function* (source: ReadStream): AsyncGenerator<string> {
  try {
    for await (const chunk of source) {
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

      yield JSON.stringify(adaptedData) + '\n'
    }
  } catch (err) {
    logger.error(err)
    throw new Error(`Stream Adaptor error - ${String(err)}`)
  }
}

export const getAllUsersStreamDB = async (): Promise<Readable> => {
  const connection = await getConnection()

  const UserRepository = connection.getRepository(User)

  const userStream = await UserRepository.createQueryBuilder('user').innerJoinAndMapOne('user.Wallet', Wallet, 'wallet', 'wallet.userId = user.userId').stream()

  // Convert the generator to a readable stream
  const readableStream = Readable.from(userStreamAdaptor(userStream), {
    objectMode: true
  })

  return readableStream
}

export const saveNewUserDB = async (firstname: string, lastname: string): Promise<User> => {
  const newUser = new User()
  newUser.userId = uuidv4()
  newUser.firstname = firstname
  newUser.lastname = lastname

  const walletCreation = await createNewWalletDB(newUser).catch((err) => err)

  if (walletCreation instanceof Error) {
    logger.error(walletCreation)
    throw new Error(`Impossible to create a new wallet or user - ${String(walletCreation)}`)
  }

  return newUser
}

export const deleteUserByIdDB = async (userId: string): Promise<boolean> => {
  // Step 1: Get user information
  const userToDeleteInfo = await getUserWalletInfoDB(userId).catch((err) => err)

  if (userToDeleteInfo instanceof Error) {
    logger.error(userToDeleteInfo)
    throw new Error(`Impossible to delete the user in DB, no user information available (step : 1) - ${String(userToDeleteInfo)}`)
  }

  // Start a transaction
  const queryRunner = await createAndStartTransaction()

  // Step 2: Delete the wallet if it exists
  if (userToDeleteInfo.Wallet) {
    const walletDeletion = await deleteWalletByIdDBTransaction(queryRunner, String(userToDeleteInfo.Wallet.walletId)).catch((err) => err)
    if (walletDeletion instanceof Error) {
      logger.error(walletDeletion)
      await queryRunner.rollbackTransaction()
      throw new Error(`Impossible to delete the user in DB (step : 2) - ${String(walletDeletion)}`)
    }
  }

  // Step 3: Delete the user
  const UserRepository = queryRunner.manager.getRepository(User)
  const deletedUser = await UserRepository.delete(userId).catch((err) => err)

  if (deletedUser instanceof Error || deletedUser.affected === 0) {
    logger.error(deletedUser)
    await queryRunner.rollbackTransaction()
    throw new Error(`Impossible to delete the user in DB (step : 3) - ${deletedUser.message}`)
  }

  // Successful tarnsaction
  await queryRunner.commitTransaction()

  // Release of the query runner
  await queryRunner.release()

  return true
}

export const getUserWalletInfoDB = async (userId: string): Promise<userWalletDBDTO> => {
  const connection = await getConnection()

  const UserRepository = connection.getRepository(User)

  const userWalletInfo = await UserRepository.createQueryBuilder('user')
    .innerJoinAndMapOne('user.Wallet', Wallet, 'wallets', 'wallets.userId = user.userId')
    .where('user.userId = :userId', { userId: userId })
    .getOne()
    .catch((err) => err)

  if (userWalletInfo instanceof Error) {
    logger.error(userWalletInfo)
    throw new Error(`Impossible to get the user informations - ${userWalletInfo.message} `)
  }

  if (userWalletInfo == null) {
    throw new Error(`Impossible to get any user with that id (response is null - user dont exists)`)
  }

  return userWalletInfo as userWalletDBDTO
}
