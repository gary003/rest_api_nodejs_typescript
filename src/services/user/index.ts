import { UserInfo } from "os"
import { commitAndQuitTransactionRunner, createAndStartTransaction, rollBackAndQuitTransactionRunner } from "../../dataServices/typeorm/connection/connectionFile"
import { getAllDBUsers, getUserWalletInfoDB, saveNewUserDB, deleteUserByIdDB } from "../../dataServices/typeorm/user"
import { updateWalletByWalletId, updateWalletByWalletIdTransaction } from "../../dataServices/typeorm/wallet"
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

export const transfertMoneyParamsValidator = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number) => {
  if (!Object.values(moneyTypes).includes(currency)) throw new Error("wrong type of currency")

  const giverUserInfo: any = await getUserWalletInfoDB(giverId)

  const giverNewBalance = Number(giverUserInfo.wallet[currency]) - amount

  if (giverNewBalance < 0) throw new Error("Not enough funds to make transaction")

  const recipientUserInfo: any = await getUserWalletInfoDB(recipientId)

  // console.log({ giverUserInfo, giverNewBalance, giverWalletToUpdate })

  return [giverUserInfo, recipientUserInfo]
}

export const transfertMoney = async (currency: moneyTypes, giverId: string, recipientId: string, amount: number) => {
  const [giverUserInfo, recipientUserInfo] = await transfertMoneyParamsValidator(currency, giverId, recipientId, amount)

  // console.log({ giverUserInfo, recipientUserInfo })

  const transacRunner = await createAndStartTransaction().catch((err) => err)

  if (!transacRunner) throw new Error("Impossible to create transaction")

  const giverNewBalance = Number(giverUserInfo.wallet[currency]) - amount

  const updateWalletGiverResult = await updateWalletByWalletIdTransaction(transacRunner, giverUserInfo.wallet.walletId, currency, giverNewBalance).catch((err) => console.log(err))

  // console.log({ updateWalletGiverResult })

  if (!updateWalletGiverResult || updateWalletGiverResult[0] === 0) {
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error("Impossible to update the giver wallet info")
  }

  // @ts-ignore
  const recipientNewBalance = Number(recipientUserInfo.wallet[currency]) + amount
  // console.log({ recipientUserInfo, recipientNewBalance })

  // @ts-ignore
  const updateWalletRecipientResult = await updateWalletByWalletIdTransaction(transacRunner, recipientUserInfo.wallet.walletId, currency, recipientNewBalance).catch((err) => console.log(err))

  // console.log({ updateWalletRecipientResult })

  if (updateWalletRecipientResult[0] === 0) {
    rollBackAndQuitTransactionRunner(transacRunner)
    throw new Error("Impossible to update the recipient wallet info")
  }

  commitAndQuitTransactionRunner(transacRunner)

  return true
}
