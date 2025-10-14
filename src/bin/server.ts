require('dotenv').config()
import sdk from './tracing'
import * as http from 'http'
import ip from 'ip'
import app from '../app'
import logger from '../v1/helpers/logger'
import { closeConnection } from '../v1/infrastructure/persistence/database/db_connection/connectionFile'

const urlBase: string = 'api/v1'

const localIp: string = ip.address()

const port: number = Number(process.env.API_PORT) || 8080

const server: http.Server = http.createServer(app)

// Graceful shutdown
const shutdown = async () => {
  try {
    // Close database connection
    await closeConnection()
    // Close monitoring tracing scrapping
    sdk.shutdown()
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
}

server.on('error', async (error) => {
  logger.error(JSON.stringify(error))
  shutdown()
  process.exit(1)
})

try {
  sdk.start()
  logger.info('node-sdk tracing started')
} catch (error) {
  logger.error('Error starting node-sdk tracing', error)
}

server.on('listening', async () => {
  if (!process.env.production) logger.info(`app running ... api documentation on localhost:${port} or http://${localIp}:${port}/${urlBase}/doc3/apiDocumentation`)
})

// Setup process handlers
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

server.listen(port)
