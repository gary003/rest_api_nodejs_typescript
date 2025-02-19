import { getConnection } from '../db_connection/connectionFile'
import { Wallet } from './entity'
import { walletDBDTO } from './walletDB.dto'
import { v4 as uuidv4 } from 'uuid'
import { QueryRunner } from 'typeorm'
import { User } from '../user/entity'
import { moneyTypes } from '../../../domain'
import logger from '../../../helpers/logger'

export const getWalletByIdDB = async (walletId: string): Promise<walletDBDTO> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const wallet = await WalletsRepository.findOne({ where: { walletId } }).catch((err) => err)

  if (wallet instanceof Error) {
    logger.error(wallet)
    throw new Error(`Impossible to found the requested wallet - ${wallet.message}`)
  }

  return wallet as walletDBDTO
}

export const updateWalletByWalletIdDB = async (walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance }).catch((err) => err)

  if (!(result instanceof Object)) {
    logger.error(result)
    throw new Error(`Impossible to found the requested wallet - ${result.message}`)
  }

  return true
}

export const updateWalletByWalletIdTransaction = async (transactionRunner: QueryRunner, walletId: string, currencyType: moneyTypes, newBalance: number): Promise<boolean> => {
  // logger.debug(JSON.stringify([walletId, currencyType, newBalance]))

  const WalletsRepository = transactionRunner.manager.getRepository(Wallet)

  const result = await WalletsRepository.update(walletId, { [currencyType]: newBalance }).catch((err) => err)

  if (!(result instanceof Object)) {
    logger.error(result)
    throw new Error(`Error while updating wallet - ${result.message}`)
  }

  if (result.affected === 0) throw new Error('Impossible to found the requested wallet')

  return true
}

export const createNewWalletDB = async (user: User): Promise<walletDBDTO> => {
  const connection = await getConnection()

  const WalletsRepository = connection.getRepository(Wallet)

  const newWalletToSave: Wallet = new Wallet()
  newWalletToSave.walletId = uuidv4()
  newWalletToSave.user = user
  newWalletToSave.hardCurrency = Math.floor(Math.random() * 2000)
  newWalletToSave.softCurrency = Math.floor(Math.random() * 2000)

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

  const result = await WalletsRepository.delete({ walletId }).catch((err) => err)

  if (result instanceof Error || result.affected === 0) {
    logger.error(result)
    throw new Error(`Impossible to delete the wallet - ${result.message}`) // Use a custom error message
  }

  return true
}
