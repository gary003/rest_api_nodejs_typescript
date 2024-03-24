import express from "express"

export function handleNotFound(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Check if any route handler has already handled the request
  if (res.headersSent) {
    return next() // Let other error handlers handle it if already responded to
  }

  res.status(404).json({ message: "Not Found" })
}
