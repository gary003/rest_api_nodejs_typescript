import { getAllDBUsers, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB } from "../../dataServices/typeorm/user"
import { updateWalletByWalletId } from "../../dataServices/typeorm/wallet"
import { moneyTypes, user } from "./dto"

export const getAllUsers = async (): Promise<user[]> => {
  const allUsers = (await getAllDBUsers().catch((err) => console.log(err))) as unknown as user[]

  if (!allUsers) throw new Error("Impossible to retreive any user")

  return allUsers
}

export const saveNewUser = async (userId: string, firstname: string, lastname: string): Promise<user> => {
  const newUser = (await saveNewUserDB(userId, firstname, lastname).catch((err) => console.log(err))) as unknown as user

  if (!newUser) throw new Error("Impossible to save the new user")

  return newUser
}

export const addCurrency = async (userId: string, currencyType: moneyTypes, amount: number): Promise<boolean> => {
  if (amount <= 0) throw new Error("The amount to add must be at least equal to 1")
  if (!Object.values(moneyTypes).includes(currencyType)) throw new Error("Wrong type of currency")

  const currentUserWalletInfo = await getUserWalletInfo(userId)

  const resultUpdate = await updateWalletByWalletId(currentUserWalletInfo.walletId, currencyType, currentUserWalletInfo.currencyType + amount).catch((err) => console.log(err))

  if (!resultUpdate) throw new Error("Impossible to update wallet")

  return true
}

export const deleteUserById = async (userId: string): Promise<boolean> => {
  const deletedUser = await deleteUserByIdDB(userId)

  if (!deletedUser) throw new Error("Impossible to delete the user")

  return deletedUser
}

export const getUserWalletInfo = async (userId: string) => {
  const userWalletI = await getUserWalletInfoDB(userId)

  if (!userWalletI) throw new Error("No user found !")

  return userWalletI
}
