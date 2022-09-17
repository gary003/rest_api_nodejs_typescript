import { Wallet } from "../wallet/entity"
import { connectionTypeORM } from "../../typeorm/connection/connectionFile"
import { User } from "./entity"
import { createNewWallet, updateWalletByWalletId } from "../wallet"
import { selectUserInfoEnum } from "./dto"
import { getUserWalletInfo } from "../../../services/user"

export const getSelectGetAllDBUsers = async (sel: { [s: string]: string }): Promise<string[]> => {
  const selectArr = Object.values(sel).reduce((acc, value) => {
    const str = value + " AS " + value.split(".")[1]
    return acc.concat(str)
  }, [])

  return selectArr
}

export const getAllDBUsers = async () => {
  const connection = await connectionTypeORM()

  const UserRepository = connection.getRepository(User)

  const selectArr = await getSelectGetAllDBUsers(selectUserInfoEnum)

  const result = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.wallet", Wallet, "wallet", "wallet.userId = user.userId")
    .select(selectArr)
    .getRawMany()
    .catch((err) => console.log(err.sqlMessage))

  await connection.destroy()

  if (!result) throw new Error("Impossible to retreive any user")

  return result
}

export const saveNewUserDB = async (userId: string, firstname: string, lastname: string): Promise<User> => {
  const connection = await connectionTypeORM()

  const newUser = new User()
  newUser.userId = userId
  newUser.firstname = firstname
  newUser.lastname = lastname

  const UserRepository = connection.getRepository(User)

  const result: User | void = await UserRepository.save(newUser).catch((err) => console.error(err))

  await connection.destroy()

  if (!result) throw new Error("Impossible to save the new user")

  const newWallet = await createNewWallet(result)

  return result
}

export const deleteUserByIdDB = async (userId: string): Promise<boolean> => {
  const connection = await connectionTypeORM()

  const userToDeleteInfo = await getUserWalletInfo(userId)
  // console.log({ userToDeleteInfo })

  const WalletRepository = connection.getRepository(Wallet)

  const deletedWallet = await WalletRepository.delete(userToDeleteInfo.wallet.walletId).catch((err) => console.log(err))

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

export const getUserWalletInfoDB = async (userId: string) => {
  const connection = await connectionTypeORM()

  const UserRepository = connection.getRepository(User)

  const userWalletInfo: any = await UserRepository.createQueryBuilder("user")
    .innerJoinAndMapOne("user.wallet", Wallet, "wallets", "wallets.userId = user.userId")
    .where("user.userId = :userId", { userId: userId })
    .getOne()
    .catch((err) => err)

  await connection.destroy()

  return userWalletInfo
}
