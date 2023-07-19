import winston from "winston"

// Create a Winston logger instance
const logger = winston.createLogger({
  level: "warn",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "logs.log" })],
})

export default logger
