import { DataSourceOptions, QueryRunner, DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../../helpers/logger'

export type transactionQueryRunnerType = QueryRunner

let connection: DataSource | null = null

export const connectionDB = async (): Promise<DataSource> => {
  const connectionOptions: DataSourceOptions = {
    name: 'db_connection',
    type: process.env.DB_DRIVER,
    host: process.env.DB_HOST,
    url: process.env.DB_URI,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    entities: [__dirname + '/../**/entity.*s'],
    synchronize: false
  } as DataSourceOptions

  const connection: DataSource = new DataSource(connectionOptions)

  // logger.debug(JSON.stringify(connectionOptions))

  await connection.initialize()

  return connection
}

// Get or create connection
export const getConnection = async (): Promise<DataSource> => {
  if (!connection || !connection.isInitialized) {
    try {
      connection = await connectionDB()
      // logger.info('Database connection established successfully')
    } catch (error) {
      // logger.error('Failed to establish database connection:', error)
      throw error
    }
  }
  return connection
}

export const createAndStartTransaction = async (): Promise<QueryRunner> => {
  const connection = await connectionDB()

  const queryRunner = connection.createQueryRunner()

  await queryRunner.connect()
  await queryRunner.startTransaction()

  return queryRunner
}

export const commitAndQuitTransactionRunner = async (queryRunner: QueryRunner): Promise<boolean> => {
  await queryRunner.commitTransaction()
  await queryRunner.release()
  await queryRunner.connection.destroy()
  return true
}

export const rollBackAndQuitTransactionRunner = async (queryRunner: QueryRunner): Promise<boolean> => {
  await queryRunner.rollbackTransaction()
  await queryRunner.release()
  await queryRunner.connection.destroy()
  return true
}

// Added function for acquiring lock on a wallet (using MySQL syntax)
export const acquireLockOnWallet = async (queryRunner: QueryRunner, walletId: string): Promise<boolean> => {
  const lockResult = await queryRunner.query('SELECT * FROM wallet WHERE walletId = ? FOR UPDATE', [walletId]).catch((err) => {
    logger.error(err)
    return null
  })

  if (!lockResult) return false

  return lockResult.length > 0 // Check if a row was returned (indicating successful lock)
}
