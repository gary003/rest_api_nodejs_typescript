import winston, { transports } from 'winston'

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // Important for error handling
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      let logMessage = `${timestamp} ${level}: ${message}`

      if (typeof stack === 'string') {
        const stackLines = stack.split('\n')
        // The second line of the stack trace typically contains the file and line number
        const errorLocation = stackLines[1]?.trim() || 'Unknown location'
        logMessage += `\n[${errorLocation}]`
      } else if (stack) {
        // Handle cases where stack exists but is not a string (e.g., custom error objects)
        logMessage += '\n[Stack trace unavailable]'
      }

      return logMessage
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
