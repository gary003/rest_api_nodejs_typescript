import { errorType } from '../../../domain/error'

export const errorAPIUSER = {
  errorAPIGetAllUsers: {
    name: 'errorAPIGetAllUsers',
    message: 'Error - Impossible to get any user from database'
  },
  errorAPIUserCreation: {
    name: 'errorAPIUserCreation',
    message: 'Error - Impossible to save the new user'
  },
  errorAPIGetUser: {
    name: 'errorAPIGetUser',
    message: 'Error - Impossible to found the requested user from database'
  },
  errorAPIInvalidUserId: {
    name: 'errorAPIInvalidUserId',
    message: 'Error - The userId provided is wrong'
  },
  errorAPIDeleteUser: {
    name: 'errorAPIDeleteUser',
    message: 'Error - Impossible to delete the user from database'
  },
  errorAPIUserTransfertWrongParams: {
    name: 'errorAPIUserTransfertWrongParams',
    message: 'Error - The params provided are wrong'
  },
  errorAPIUserTransferIllegalAmount: {
    name: 'errorAPIUserTransferIllegalAmount',
    message: 'Error - The amount for transferingmust be > 0 '
  },
  errorAPIUserTransferNoResults: {
    name: 'errorAPIUserTransferNoResults',
    message: 'Error - The query returned no results'
  },
  errorAPIUserTransferSelf: {
    name: 'errorAPIUserTransferSelf',
    message: 'Error - Same id for receiver and sender'
  }
} as const

export const errorValidationUser: Record<string, errorType> = {
  errorParamUserId: {
    name: 'errorValidationUser',
    message: 'Error - Wrong userId info in route - middleware error'
  }
} as const
