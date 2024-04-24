import { Wallet } from "../wallet/entity"
import { connectionDB } from "../connection/connectionFile"
import { User } from "./entity"
import { createNewWalletDB, deleteWalletByIdDB } from "../wallet"
import { userInfo } from "./dto"
import logger from "../../../infrastructure/logger"

export const getAllUsersDB = async (): Promise<userInfo[]> => {
  const connection = await connectionDB()

  const UserRepository = connection.getRepository(User)

  const result = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.Wallet", Wallet, "wallet", "wallet.userId = user.userId")
    .getMany()
    .catch((err) => {
      logger.error(err.sqlMessage)
      return null
    })

  await connection.destroy()

  if (!result) throw new Error("Impossible to retreive any user")

  // logger.debug(JSON.stringify(result))

  return result as userInfo[]
}

export const saveNewUserDB = async (userId: string, firstname: string, lastname: string): Promise<User> => {
  const newUser = new User()
  newUser.userId = userId
  newUser.firstname = firstname
  newUser.lastname = lastname

  const walletCreation = await createNewWalletDB(newUser).catch((err) => {
    logger.error(err)
    return null
  })

  if (!walletCreation) throw new Error("Impossible to create a new wallet or user")

  return newUser
}

export const deleteUserByIdDB = async (userId: string): Promise<boolean> => {
  const connection = await connectionDB()

  const userToDeleteInfo = await getUserWalletInfoDB(userId).catch((err) => {
    logger.error(err)
    return null
  })

  if (!userToDeleteInfo) {
    await connection.destroy()
    throw new Error("Impossible to delete the user in DB, no user information available (step : 0)")
  }
  // logger.debug(JSON.stringify(userToDeleteInfo))

  if (!!userToDeleteInfo.Wallet) {
    const walletDeletion = await deleteWalletByIdDB(String(userToDeleteInfo.Wallet.walletId)).catch((err) => {
      logger.error(err)
      return null
    })

    if (!walletDeletion) {
      await connection.destroy()
      throw new Error("Impossible to delete the user in DB (step : 1)")
    }
  }
  // Let the db some time to handle the previous request
  await new Promise((resolve) => setTimeout(resolve, 709))

  const UserRepository = connection.getRepository(User)

  const deletedUser = await UserRepository.delete(userId).catch((err) => {
    logger.error(err)
    return null
  })

  if (!deletedUser || deletedUser.affected === 0) {
    await connection.destroy()
    throw new Error("Impossible to delete the user in DB (step : 2)")
  }

  await connection.destroy()

  return true
}

export const getUserWalletInfoDB = async (userId: string): Promise<userInfo> => {
  const connection = await connectionDB()

  const UserRepository = connection.getRepository(User)

  const userWalletInfo = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.Wallet", Wallet, "wallets", "wallets.userId = user.userId")
    .where("user.userId = :userId", { userId: userId })
    .getOne()
    .catch((err) => err)

  await connection.destroy()

  return userWalletInfo as userInfo
}
