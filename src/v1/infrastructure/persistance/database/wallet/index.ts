import { getConnection } from '../db_connection/connectionFile'
import { Wallet } from './entity'
import { walletDBDTO } from './walletDB.dto'
import { v4 as uuidv4 } from 'uuid'
import { QueryRunner } from 'typeorm'
import { Customer } from '../customer/entity'
import { moneyTypes, moneyTypesO2 } from '../../../../domain'
import logger from '../../../../helpers/logger'

export const getWalletByIdDB = async (walletId: string): Promise<walletDBDTO> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const wallet = await WalletsRepository.findOne({ where: { wallet_id: walletId } }).catch((err) => err)

  if (wallet instanceof Error) {
    logger.error(wallet)
    throw new Error(`Impossible to found the requested wallet - ${wallet.message}`)
  }

  return wallet as walletDBDTO
}

export const updateWalletByWalletIdDB = async (walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [moneyTypesO2[currencyType]]: newBalance }).catch((err) => err)

  if (result instanceof Error) {
    logger.error(result)
    throw new Error(`Impossible to found the requested wallet - ${String(result)}`)
  }

  return true
}

export const updateWalletByWalletIdTransaction = async (transactionRunner: QueryRunner, walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  // logger.debug(JSON.stringify([walletId, currencyType, newBalance]))

  const WalletsRepository = transactionRunner.manager.getRepository(Wallet)

  const curr = String(moneyTypesO2[currencyType])

  const result = await WalletsRepository.update(walletId, { [curr]: newBalance }).catch((err) => err)

  if (result instanceof Error) {
    logger.error(result)
    throw new Error(`Error while updating wallet - ${String(result)}`)
  }

  if (result.affected === 0) throw new Error('Impossible to found the requested wallet')

  return true
}

export const createNewWalletDB = async (customer: Customer): Promise<walletDBDTO> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const newWalletToSave: Wallet = new Wallet()
  newWalletToSave.wallet_id = uuidv4()
  newWalletToSave.customer = customer
  newWalletToSave.hard_currency = Math.floor(Math.random() * 2000)
  newWalletToSave.soft_currency = Math.floor(Math.random() * 2000)

  const newWallet = await WalletsRepository.save(newWalletToSave).catch((err) => err)

  if (newWallet instanceof Error) {
    logger.error(newWallet)
    throw new Error(`Impossible to save the new wallet - ${newWallet.message}`)
  }

  return newWallet
}

export const deleteWalletByIdDB = async (walletId: string): Promise<boolean> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.delete({ wallet_id: walletId }).catch((err) => err)

  if (result instanceof Error || result.affected === 0) {
    logger.error(result)
    throw new Error(`Impossible to delete the wallet - ${result.message}`) // Use a custom error message
  }

  return true
}

export const deleteWalletByIdDBTransaction = async (queryRunner: QueryRunner, walletId: string) => {
  const WalletsRepository = queryRunner.manager.getRepository(Wallet)

  const result = await WalletsRepository.delete({ wallet_id: walletId }).catch((err) => err)

  if (result instanceof Error) {
    logger.error(result)
    throw new Error(`Impossible to delete the wallet - ${String(result)}`) // Use a custom error message
  }

  if (result.affected === 0) {
    const errStr = `Impossible to delete the wallet - No wallet found - idWallet = ${walletId}`
    logger.error(errStr)
    throw new Error(errStr) // Use a custom error message
  }

  return true
}
