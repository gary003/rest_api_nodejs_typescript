import winston, { createLogger, transports } from 'winston'

const logger = createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // Important for error handling
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`
    })
  ),
  exceptionHandlers: [new transports.File({ filename: './logs/exceptions.log' })]
})

if (process.env.NODE_ENV === 'production') {
  logger.level = 'error'
  logger.add(
    new transports.File({
      level: 'error',
      filename: './logs/error.log',
      handleRejections: true
    })
  )
} else {
  logger.level = process.env.LOGLEVEL || 'debug'
  logger.add(new transports.Console())
}

export default logger
