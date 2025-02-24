import { DataSourceOptions, QueryRunner, DataSource } from 'typeorm'
import logger from '../../../helpers/logger'
import { v4 as uuidv4 } from 'uuid'

export type transactionQueryRunnerType = QueryRunner

let connection: DataSource | null = null

const getConnectionOptions = async (): Promise<DataSourceOptions> => {
  return {
    name: `db_connection_${uuidv4()}`,
    type: process.env.DB_DRIVER,
    host: process.env.DB_HOST,
    url: process.env.DB_URI,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    entities: [__dirname + '/../**/entity.*s'],
    synchronize: false,
    // logging: process.env.LOGLEVEL === 'debug',
    poolSize: 10, // Maximum number of connections in the pool
    poolErrorHandler: (err) => logger.error('Connection pool error:', err),
    extra: {
      connectionLimit: 10, // Max connections (matches poolSize)
      queueLimit: 0 // No limit on queued requests (adjust based on needs)
      // waitForConnections: true
    }
  } as DataSourceOptions
}

export const tryToConnectDB = async (): Promise<DataSource> => {
  try {
    const dbOptions: DataSourceOptions = await getConnectionOptions()
    const connection: DataSource = new DataSource(dbOptions)
    await connection.initialize()
    return connection
  } catch (error) {
    const errorMessage = `Failed to create a new connection to DB - ${String(error)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const connectionDB = async (currenAttempt = 1, maxAttempts: number = 4, delay: number = 150): Promise<DataSource> => {
  try {
    return await tryToConnectDB()
  } catch (error) {
    if (currenAttempt < maxAttempts) {
      const nextAttempt = currenAttempt + 1
      const waitTime = delay * Math.pow(2, currenAttempt)
      logger.warn(`Warning - fail to connect to DB - retry in ${waitTime} seconds`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      return connectionDB(nextAttempt, maxAttempts, delay)
    }

    const errorInfo = `Error - Impossible to connect to db after ${maxAttempts} attempts - ${String(error)}`
    logger.error(errorInfo)
    throw new Error(errorInfo)
  }
}

// Get or create connection
export const getConnection = async (): Promise<DataSource> => {
  if (connection && connection.isInitialized) return connection

  const newConnection = await connectionDB().catch((err) => err)

  if (connection instanceof Error) {
    const errorMessage = `Failed to establish database connection - ${String(connection)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }

  return newConnection
}

// Close connection
export const closeConnection = async (): Promise<void> => {
  if (connection && connection.isInitialized) {
    try {
      await connection.destroy()
      connection = null
      // logger.debug('Database connection closed successfully')
    } catch (error) {
      const errorMessage = `Error closing database connection - ${String(error)}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
}

export const createAndStartTransaction = async (): Promise<QueryRunner> => {
  try {
    const connection = await connectionDB()
    const queryRunner = connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    return queryRunner
  } catch (error) {
    const errorMessage = `Error impossible to create transaction runner object - ${String(error)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const commitAndQuitTransactionRunner = async (queryRunner: QueryRunner): Promise<boolean> => {
  try {
    await queryRunner.commitTransaction()
    await queryRunner.release()
    await queryRunner.connection.destroy()
    return true
  } catch (error) {
    const errorMessage = `Error trying to commit transaction to DB - ${String(error)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const rollBackAndQuitTransactionRunner = async (queryRunner: QueryRunner): Promise<boolean> => {
  try {
    await queryRunner.rollbackTransaction()
    await queryRunner.release()
    await queryRunner.connection.destroy()
    return true
  } catch (error) {
    const errorMessage = `Error trying to rollback transaction - ${String(error)}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

// Added function for acquiring lock on a wallet (using MySQL syntax)
export const acquireLockOnWallet = async (queryRunner: QueryRunner, walletId: string): Promise<boolean> => {
  const lockResult = await queryRunner.query('SELECT * FROM wallet WHERE walletId = ? FOR UPDATE', [walletId]).catch((err) => err)

  if (lockResult instanceof Error) {
    const errorInfo = `Error - Impossible to set the lock for db transaction - ${String(lockResult)}`
    logger.error(errorInfo)
    return false
  }

  return lockResult.length > 0
}
