import { errorType } from '../../../domain/error'

export const errorAPIUSER: Record<string, errorType> = {
  errorAPIGetAllUsers: {
    name: 'errorAPIGetAllUsers',
    message: 'Error - Impossible to get any user from database',
    httpCode: 500
  },
  errorAPIUserCreation: {
    name: 'errorAPIUserCreation',
    message: 'Error - Impossible to save the new user',
    httpCode: 400
  },
  errorAPIGetUser: {
    name: 'errorAPIGetUser',
    message: 'Error - Impossible to found the requested user from database',
    httpCode: 400
  },
  errorAPIInvalidUserId: {
    name: 'errorAPIInvalidUserId',
    message: 'Error - The userId provided is wrong',
    httpCode: 400
  },
  errorAPIDeleteUser: {
    name: 'errorAPIDeleteUser',
    message: 'Error - Impossible to delete the user from database',
    httpCode: 500
  },
  errorAPIUserTransfertWrongParams: {
    name: 'errorAPIUserTransfertWrongParams',
    message: 'Error - The params provided are wrong',
    httpCode: 404
  },
  errorAPIUserTransferIllegalAmount: {
    name: 'errorAPIUserTransferIllegalAmount',
    message: 'Error - The amount for transferingmust be > 0 ',
    httpCode: 404
  },
  errorAPIUserTransferNoResults: {
    name: 'errorAPIUserTransferNoResults',
    message: 'Error - The query returned no results',
    httpCode: 500
  }
} as const

export const errorValidationUser: Record<string, errorType> = {
  errorParamUserId: {
    name: 'errorValidationUser',
    message: 'Error - Wrong userId info in route - middleware error',
    httpCode: 404
  }
} as const
