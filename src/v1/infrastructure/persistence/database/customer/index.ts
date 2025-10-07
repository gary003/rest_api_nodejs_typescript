import { Wallet } from '../wallet/entity'
import { createAndStartTransaction, getConnection } from '../db_connection/connectionFile'
import { Customer } from './entity'
import { createNewWalletDB, deleteWalletByIdDBTransaction } from '../wallet'
import { pipeline } from 'stream'
import logger from '../../../../helpers/logger'
import { v4 as uuidv4 } from 'uuid'
import { customerWalletDBDTO, customerWalletFromTableDB } from './userWalletDB.dto'
import { ReadStream } from 'fs'

export const getAllCustomersDBAdapter = (customerDB: customerWalletFromTableDB): customerWalletDBDTO => {
  return {
    userId: customerDB.customer_id,
    firstname: customerDB.firstname,
    lastname: customerDB.lastname,
    Wallet: {
      walletId: customerDB.Wallet.wallet_id,
      hardCurrency: customerDB.Wallet.hard_currency,
      softCurrency: customerDB.Wallet.soft_currency
    }
  }
}

// Get all customerss with their wallets from the database
export const getAllCustomersDB = async (): Promise<customerWalletDBDTO[]> => {
  const connection = await getConnection() // Get DB connection
  const UserRepository = connection.getRepository(Customer) // Get Cusdtomer repository

  // Query to fetch all customers with their wallets
  const result = await UserRepository.createQueryBuilder('customer')
    .innerJoinAndMapOne('customer.Wallet', Wallet, 'wallet', 'wallet.customer_id = customer.customer_id')
    .getMany()
    .catch((err) => err)

  // Handle errors during query execution
  if (result instanceof Error) {
    const errorMessage = `Impossible to retrieve any customer - ${String(result)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }

  // Create result customers with wallets
  const customersResults = result.map((chunk: customerWalletFromTableDB) => {
    return getAllCustomersDBAdapter(chunk)
  })

  return customersResults
}

// Adapts a database stream into a generator yielding JSON strings of customer data
export const customerStreamAdaptor = async function* (source: ReadStream): AsyncGenerator<string> {
  try {
    // Process each chunk in the stream
    for await (const chunk of source) {
      // Map chunk to userWalletDBDTO format
      const adaptedData = {
        userId: chunk.customer_customer_id,
        firstname: chunk.customer_firstname,
        lastname: chunk.customer_lastname,
        Wallet: {
          walletId: chunk.wallet_wallet_id,
          hardCurrency: chunk.wallet_hard_currency,
          softCurrency: chunk.wallet_soft_currency
        }
      }

      yield `${JSON.stringify(adaptedData)}\n`
    }
  } catch (err) {
    logger.error(err) // Log stream processing errors
    throw new Error(`Stream Adaptor error - ${String(err)}`)
  }
}

// Get all customers as a stream for efficient handling of large datasets
export const getAllUsersStreamDB = async () => {
  const connection = await getConnection() // Get DB connection
  const CustomerRepository = connection.getRepository(Customer) // Get User repository

  // Query to stream customers with their wallets
  const customerStream = await CustomerRepository.createQueryBuilder('customer')
    .innerJoinAndMapOne('customer.Wallet', Wallet, 'wallet', 'wallet.customer_id = customer.customer_id')
    .stream()

  return pipeline(customerStream, customerStreamAdaptor, (err) => err)
}

// Save a new customer to the database and create a wallet for them
export const saveNewCustomerDB = async (firstname: string, lastname: string): Promise<Customer> => {
  const newCustomer = new Customer() // Create new customer entity
  newCustomer.customer_id = uuidv4() // Generate unique ID
  newCustomer.firstname = firstname
  newCustomer.lastname = lastname

  // Create a wallet for the new customer
  const walletCreation = await createNewWalletDB(newCustomer).catch((err) => err)

  // Handle wallet creation errors
  if (walletCreation instanceof Error) {
    logger.error(walletCreation)
    throw new Error(`Impossible to create a new wallet or customer - ${String(walletCreation)}`)
  }

  return newCustomer // Return the new customer
}

// Delete a customer and their associated wallet from the database
export const deleteCustomerByIdDB = async (customerId: string): Promise<boolean> => {
  // Step 1: Get customer info
  const customerToDeleteInfo = await getCustomerWalletInfoDB(customerId).catch((err) => err)

  // Handle errors during customer info retrieval
  if (customerToDeleteInfo instanceof Error) {
    logger.error(customerToDeleteInfo)
    throw new Error(`Impossible to delete the customer in DB, no customer info available (step 1) - ${String(customerToDeleteInfo)}`)
  }

  // Start a transaction
  const queryRunner = await createAndStartTransaction()

  // Step 2: Delete the wallet if it exists
  if (customerToDeleteInfo.Wallet) {
    const walletDeletion = await deleteWalletByIdDBTransaction(queryRunner, String(customerToDeleteInfo.Wallet.walletId)).catch((err) => err)

    // Handle wallet deletion errors
    if (walletDeletion instanceof Error) {
      logger.error(walletDeletion)
      await queryRunner.rollbackTransaction() // Rollback on failure
      throw new Error(`Impossible to delete the customer in DB (step 2) - ${walletDeletion.message}`)
    }
  }

  // Step 3: Delete the customer
  const UserRepository = queryRunner.manager.getRepository(Customer)
  const deletedUser = await UserRepository.delete(customerId).catch((err) => err)

  // Handle customer deletion errors
  if (deletedUser instanceof Error) {
    logger.error(deletedUser)
    await queryRunner.rollbackTransaction() // Rollback on failure
    throw new Error(`Impossible to delete the customer in DB (step 3) - ${deletedUser.message}`)
  }

  if (deletedUser.affected === 0) {
    logger.error(deletedUser)
    throw new Error('Impossible to delete the customer in DB (step 3) - no row affected')
  }

  // Commit the transaction
  await queryRunner.commitTransaction()

  // Release the query runner
  await queryRunner.release()

  return true // Return success
}

// Get a customer's wallet info by their ID
export const getCustomerWalletInfoDB = async (customerId: string) => {
  const connection = await getConnection() // Get DB connection
  const CustomerRepository = connection.getRepository(Customer) // Get User repository

  // Query to fetch customer's wallet info
  const customerWalletInfo = await CustomerRepository.createQueryBuilder('customer')
    .innerJoinAndMapOne('customer.Wallet', Wallet, 'wallet', 'wallet.customer_id = customer.customer_id')
    .where('customer.customer_id = :customerId', { customerId: customerId })
    .getOne()
    .catch((err) => err)

  // Handle query errors
  if (customerWalletInfo instanceof Error) {
    logger.error(customerWalletInfo)
    throw new Error(`Impossible to get the customer info - ${customerWalletInfo.message}`)
  }

  // Handle case where customer doesn't exist
  if (customerWalletInfo == null) {
    throw new Error('Impossible to get any customer with that ID (response is null - customer doesnt exist)')
  }

  return getAllCustomersDBAdapter(customerWalletInfo) // Return customer's wallet info
}
