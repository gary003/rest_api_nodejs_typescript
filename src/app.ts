require("dotenv").config()

import express from "express"
import userRoute from "./routes/user/index"

import swaggerUi from "swagger-ui-express"
import swaggerJson from "./helpers/swagger/config"

import cors from "cors"

const app = express()

app.use("/apiDoc", swaggerUi.serve, swaggerUi.setup(swaggerJson))

app.use(cors())
app.use(express.json())

app.use("/api/user", userRoute)

export default app
