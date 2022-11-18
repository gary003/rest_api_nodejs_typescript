import { Wallet } from "../wallet/entity"
import { connectionTypeORM } from "../../typeorm/connection/connectionFile"
import { User } from "./entity"
import { createNewWallet, updateWalletByWalletId } from "../wallet"
import { getUserWalletInfo } from "../../../services/user"
import { userInfo } from "./dto"

export const getAllDBUsers = async (): Promise<userInfo[]> => {
  const connection = await connectionTypeORM()

  const UserRepository = connection.getRepository(User)

  const result = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.Wallet", Wallet, "wallet", "wallet.userId = user.userId")
    .getMany()
    .catch((err) => console.log(err.sqlMessage))

  await connection.destroy()

  if (!result) throw new Error("Impossible to retreive any user")
  // console.log(result)

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

  const userToDeleteInfo = await getUserWalletInfo(userId)
  // console.log({ userToDeleteInfo })

  const WalletRepository = connection.getRepository(Wallet)

  const deletedWallet = await WalletRepository.delete(userToDeleteInfo.Wallet.walletId).catch((err) => console.log(err))
  // console.log({ deletedWallet })

  if (!deletedWallet || deletedWallet.affected === 0) {
    await connection.destroy()
    throw new Error("Impossible to delete the user in DB (step : 1)")
  }

  const UserRepository = connection.getRepository(User)

  const deletedUser = await UserRepository.delete(userId).catch((err) => console.log(err))

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
