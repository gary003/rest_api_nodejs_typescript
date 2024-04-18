import express from "express"
import logger from "../helpers/logger"

export function handleError(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  logger.error(err.stack) // Log the error for debugging

  // Set default status code to 500 (Internal Server Error)
  let statusCode = 500

  // Map specific error types to appropriate status codes
  if (err.name === "ValidationError") {
    statusCode = 400 // Bad request for validation errors
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401 // Unauthorized for authentication errors
  } else if (err.name === "ForbiddenError") {
    statusCode = 403 // Forbidden for authorization errors
  }

  // Craft a generic error response with optional details based on environment
  const errorResponse = {
    message: "Internal Server Error", // Default message
    error: "",
  }

  if (process.env.NODE_ENV === "development") {
    errorResponse.error = err.message // Include more details in development
  }

  res.status(statusCode).json(errorResponse)
}
