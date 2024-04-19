require("dotenv").config()

import express from "express"
import userRoute from "./application/routes/user/index"

import { handleError } from "./middlewares/errorHandler"
import { handleNotFound } from "./middlewares/handleNotFound"

import swaggerUi from "swagger-ui-express"
import swaggerJson from "./helpers/swagger/config"

import helmet from "helmet"
import cors from "cors"

const app = express()

app.use("/apiDoc", swaggerUi.serve, swaggerUi.setup(swaggerJson))

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use("/api/v1/user", userRoute)

// Not found handler
app.use(handleNotFound)

// Error handler middleware
app.use(handleError)

export default app
