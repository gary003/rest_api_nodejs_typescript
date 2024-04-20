export type errorType = {
  name: string
  message: string
  httpCode: number
}

export const errorAPIUSER: Record<string, errorType> = {
  errorAPIGetAllUsers: {
    name: "errorAPIGetAllUsers",
    message: "Error - Impossible to get any user from database",
    httpCode: 500,
  },
  errorAPIUserCreation: {
    name: "errorAPIUserCreation",
    message: "Error - Impossible to save the new user",
    httpCode: 400,
  },
  errorAPIGetUser: {
    name: "errorAPIGetUser",
    message: "Error - Impossible to found the requested user from database",
    httpCode: 400,
  },
  errorAPIInvalidUserId: {
    name: "errorAPIInvalidUserId",
    message: "Error - The userId prvided is wrong",
    httpCode: 400,
  },
  errorAPIDeleteUser: {
    name: "errorAPIDeleteUser",
    message: "Error - Impossible to delete the user from database",
    httpCode: 500,
  },
} as const
