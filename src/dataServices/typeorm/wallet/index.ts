import { connectionTypeORM } from "../../typeorm/connection/connectionFile"
import { Wallet } from "./entity"
import { v4 as uuidv4 } from "uuid"
import { QueryRunner } from "typeorm"
import { moneyTypes } from "../../../services/wallet/dto"
import { User } from "../user/entity"

export const getWalletById = async (walletId: string) => {
  const connection = await connectionTypeORM()

  const WalletsRepository = connection.getRepository(Wallet)

  const wallet: Wallet | void = await WalletsRepository.findOne({ where: { walletId } }).catch((err) => console.error(err))

  await connection.destroy()

  if (!wallet) throw new Error("Impossible to found the requested wallet")

  return wallet
}

export const updateWalletByWalletId = async (walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  const connection = await connectionTypeORM()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance })

  await connection.destroy()

  if (result.affected === 0) throw new Error("Impossible to found the requested wallet")

  return true
}

export const updateWalletByWalletIdTransaction = async (transactionRunner: QueryRunner, walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  // console.log({ walletId, currencyType, newBalance })
  const WalletsRepository = transactionRunner.manager.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance })

  if (result.affected === 0) throw new Error("Impossible to found the requested wallet")

  return true
}

export const createNewWallet = async (user: User): Promise<Wallet> => {
  const connection = await connectionTypeORM()

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
