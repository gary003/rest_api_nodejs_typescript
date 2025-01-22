require('dotenv').config()
import * as http from 'http'
import ip from 'ip'
import app from '../app'
import logger from '../v1/helpers/logger'
import { closeConnection, getConnection } from '../v1/infrastructure/persistance/connection/connectionFile'

const localIp: string = ip.address()

const port: number = Number(process.env.API_PORT) || 8080

const server: http.Server = http.createServer(app)

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await getConnection()
    logger.info('Database connection initialization is ok !')
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Database initialization failed, error message: ', error)
    } else {
      logger.error('Database initialization failed:', error)
    }
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async () => {
  try {
    await closeConnection()
    logger.info('db connection shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
}

server.on('error', async (error) => {
  logger.error(JSON.stringify(error))
  await shutdown()
  process.exit(1)
})

server.on('listening', () => {
  initializeDatabase()

  logger.info(`app running on http://${localIp}:${port}`)
  logger.info(`api documentation on http://${localIp}:${port}/apiDoc`)
})

// Setup process handlers
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

server.listen(port)
