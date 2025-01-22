import winston, { createLogger, format, transports } from 'winston'
const { combine, timestamp, printf } = format

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

const logger = createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // Important for error handling
    winston.format.timestamp(),
    winston.format.json()
  ),
  exceptionHandlers: [new transports.File({ filename: 'exceptions.log' })]
})

// Call rejections.handle with a transport to handle rejections
logger.rejections.handle(new transports.File({ filename: 'rejections.log' }))

if (process.env.NODE_ENV === 'production') {
  logger.level = 'error'
  logger.add(
    new transports.File({
      level: 'error',
      filename: 'error.log',
      handleRejections: true
    })
  )
} else {
  logger.level = process.env.LOGLEVEL || 'debug'
  logger.add(new transports.Console())
}

export default logger
