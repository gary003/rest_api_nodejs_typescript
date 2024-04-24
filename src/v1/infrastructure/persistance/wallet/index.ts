import { connectionDB } from "../connection/connectionFile"
import { Wallet } from "./entity"
import { v4 as uuidv4 } from "uuid"
import { QueryRunner } from "typeorm"
import { User } from "../user/entity"
import { moneyTypes } from "../../../domain"
import logger from "../../logger"

export const getWalletByIdDB = async (walletId: string) => {
  const connection = await connectionDB()

  const WalletsRepository = connection.getRepository(Wallet)

  const wallet: Wallet | void | null = await WalletsRepository.findOne({ where: { walletId } }).catch((err) => console.error(err))

  await connection.destroy()

  if (!wallet) throw new Error("Impossible to found the requested wallet")

  return wallet
}

export const updateWalletByWalletIdDB = async (walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  const connection = await connectionDB()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance })

  await connection.destroy()

  if (result.affected === 0) throw new Error("Impossible to found the requested wallet")

  return true
}

export const updateWalletByWalletIdTransaction = async (transactionRunner: QueryRunner, walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  // logger.debug(JSON.stringify([walletId, currencyType, newBalance]))

  const WalletsRepository = transactionRunner.manager.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance })

  if (result.affected === 0) throw new Error("Impossible to found the requested wallet")

  return true
}

export const createNewWalletDB = async (user: User): Promise<Wallet> => {
  const connection = await connectionDB()

  const WalletsRepository = connection.getRepository(Wallet)

  const newWalletToSave: Wallet = new Wallet()
  newWalletToSave.walletId = uuidv4()
  newWalletToSave.user = user
  newWalletToSave.hardCurrency = Math.floor(Math.random() * 95) + 5
  newWalletToSave.softCurrency = Math.floor(Math.random() * 990) + 10

  const newWallet = await WalletsRepository.save(newWalletToSave)

  await connection.destroy()

  if (!newWallet) throw new Error("Impossible to save the new wallet")

  return newWallet
}

export const deleteWalletByIdDB = async (walletId: string): Promise<boolean> => {
  const connection = await connectionDB()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.delete({ walletId }).catch((err) => {
    logger.error(err)
    return null
  })

  await connection.destroy()

  if (!result || result.affected === 0) {
    throw new Error("Impossible to delete the wallet") // Use a custom error message
  }

  return true
}
