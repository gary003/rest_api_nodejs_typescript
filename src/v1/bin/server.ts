require("dotenv").config()

import * as http from "http"
import ip from "ip"
import app from "../app"

const localIp: string = ip.address()

const port: number = Number(process.env.API_PORT) || 8888

const server: http.Server = http.createServer(app)

server.on("error", (error) => {
  console.log(error)
  process.exit(1)
})

server.on("listening", () => {
  console.log(`listen on http://${localIp}:${port}`)
  console.log(`swagger/OpenAPI on http://${localIp}:${port}/apiDoc`)
})

server.listen(port)
