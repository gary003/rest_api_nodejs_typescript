require('dotenv').config()
import express from 'express'
import userRoute from './v1/presentation/routes/user/index'

import swaggerUi from 'swagger-ui-express'
import apiDocumentation from './v1/helpers/apiDocumentation/v2'
// import { openApiOptions } from './v1/helpers/apiDocumentation/v3/docOptions'
import openApiSpec from './v1/helpers/apiDocumentation/v3'

import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import logger from './v1/helpers/logger'

import rateLimit from 'express-rate-limit'

const app = express()

const urlBase: string = 'api/v1'

if (!process.env.production) {
  // openAPI V2
  app.use(`/${urlBase}/doc2/apiDocumentation`, swaggerUi.serve, swaggerUi.setup(apiDocumentation))

  // openAPI V3
  // app.use('/apiDocV3', swaggerUi.serve, swaggerUi.setup(openApiSpec, openApiOptions))
  app.use(`/${urlBase}/doc3/apiDocumentation`, swaggerUi.serve, swaggerUi.setup(openApiSpec))
}

app.use(compression())
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })) // 100 req/15min

// Redirect root URL to /apiDocV3
app.get('/', (req, res) => {
  return res.status(300).redirect(`/${urlBase}/doc3/apiDocumentation`)
})

app.use(`/${urlBase}/user`, userRoute)

const handleNotFound = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Check if any route handler has already handled the request
  if (res.headersSent) {
    return next() // Let other error handlers handle it if already responded to
  }

  return res.status(404).json({ message: 'Not Found' })
}

const handleError = (err: Error, req: express.Request, res: express.Response) => {
  logger.error(err.stack) // Log the error for debugging

  // Set default status code to 500 (Internal Server Error)
  let statusCode = 500

  // Map specific error types to appropriate status codes
  if (err.name === 'ValidationError') {
    statusCode = 400 // Bad request for validation errors
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401 // Unauthorized for authentication errors
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403 // Forbidden for authorization errors
  }

  // Craft a generic error response with optional details based on environment
  const errorResponse = {
    message: 'Internal Server Error', // Default message
    error: ''
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message // Include more details in development
  }

  res.status(statusCode).json(errorResponse)
}

// Not found handler
app.use(handleNotFound)

// Error handler middleware
app.use(handleError)

export default app
