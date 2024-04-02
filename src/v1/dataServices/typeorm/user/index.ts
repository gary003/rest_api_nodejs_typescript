import { Wallet } from "../wallet/entity"
import { connectionTypeORM } from "../../typeorm/connection/connectionFile"
import { User } from "./entity"
import { createNewWallet } from "../wallet"
import { userInfo } from "./dto"
import logger from "../../../helpers/logger"

export const getAllDBUsers = async (): Promise<userInfo[]> => {
  const connection = await connectionTypeORM()

  const UserRepository = connection.getRepository(User)

  const result = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.Wallet", Wallet, "wallet", "wallet.userId = user.userId")
    .getMany()
    .catch((err) => {
      logger.error(err.sqlMessage)
      return err
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

  await createNewWallet(newUser)

  return newUser
}

export const deleteUserByIdDB = async (userId: string): Promise<boolean> => {
  const connection = await connectionTypeORM()

  const userToDeleteInfo = await getUserWalletInfoDB(userId)

  // logger.debug(JSON.stringify(userToDeleteInfo))

  const WalletRepository = connection.getRepository(Wallet)

  const deletedWallet = await WalletRepository.delete(userToDeleteInfo.Wallet.walletId).catch((err) => {
    logger.error(err)
    return err
  })

  // logger.debug(JSON.stringify(deletedWallet))

  if (!deletedWallet || deletedWallet.affected === 0) {
    await connection.destroy()
    throw new Error("Impossible to delete the user in DB (step : 1)")
  }

  // Let the db some time to handle the previous request
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const UserRepository = connection.getRepository(User)

  const deletedUser = await UserRepository.delete(userId).catch((err) => {
    logger.error(err)
    return err
  })

  if (!deletedUser || deletedUser.affected === 0) {
    await connection.destroy()
    throw new Error("Impossible to delete the user in DB (step : 2)")
  }

  await connection.destroy()

  return true
}

export const getUserWalletInfoDB = async (userId: string): Promise<userInfo> => {
  const connection = await connectionTypeORM()

  const UserRepository = connection.getRepository(User)

  const userWalletInfo = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.Wallet", Wallet, "wallets", "wallets.userId = user.userId")
    .where("user.userId = :userId", { userId: userId })
    .getOne()
    .catch((err) => err)

  await connection.destroy()

  return userWalletInfo as userInfo
}
