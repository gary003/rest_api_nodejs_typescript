require("dotenv").config()

import * as http from "http"
import ip from "ip"
import app from "../app"
import logger from "../v1/helpers/logger"

const localIp: string = ip.address()

const port: number = Number(process.env.API_PORT) || 8080

const server: http.Server = http.createServer(app)

server.on("error", (error) => {
  logger.error(error)
  process.exit(1)
})

server.on("listening", () => {
  logger.info(`app running on http://${localIp}:${port}`)
  logger.info(`api documentation on http://${localIp}:${port}/apiDoc`)
})

server.listen(port)
