import { errorType } from '../../../domain/error'

export const transferMoneyErrors: Record<string, errorType> = {
  ErrorParamsValidator: {
    name: 'ErrorParamsValidator',
    message: 'Error - Failed to retreive recipient - giver informations',
    httpCode: 500
  },
  ErrorLockAcquisition: {
    name: 'ErrorLockAcquisition',
    message: 'Error - Lock - Failed to acquire locks on wallets',
    httpCode: 501
  },
  ErrorTransactionCreation: {
    name: 'ErrorTransactionCreation',
    message: 'Error - Failed to create database transaction',
    httpCode: 500
  },
  ErrorUpdateGiverWallet: {
    name: 'ErrorUpdateGiverWallet',
    message: "Error - Failed to update giver's wallet balance",
    httpCode: 500
  },
  ErrorUpdateRecipientWallet: {
    name: 'ErrorUpdateRecipientWallet',
    message: "Error - Failed to update recipient's wallet balance",
    httpCode: 500
  }
} as const

export const userFunctionsErrors: Record<string, errorType> = {
  ErrorRetrievingUsers: {
    name: 'ErrorRetrievingUsers',
    message: 'Error - Failed to retrieve users from database',
    httpCode: 500
  },
  ErrorGettingWalletInfo: {
    name: 'ErrorGettingWalletInfo',
    message: 'Error - no wallet ibfo found',
    httpCode: 500
  },
  ErrorNoWalletUser: {
    name: 'ErrorNoWalletUser',
    message: 'Error - User with no wallet',
    httpCode: 500
  },
  ErrorCreatingUser: {
    name: 'ErrorCreatingUser',
    message: 'Error - Failed to create a new user',
    httpCode: 500
  },
  ErrorUpdatingWallet: {
    name: 'ErrorUpdatingWallet',
    message: "Error - Failed to update user's wallet",
    httpCode: 500
  },
  ErrorDeletingUser: {
    name: 'ErrorDeletingUser',
    message: 'Error - Failed to delete user',
    httpCode: 404
  },
  ErrorFetchingUserInfo: {
    name: 'ErrorFetchingUserInfo',
    message: 'Error - Failed to fetch user information',
    httpCode: 500
  }
} as const

export const moneyTransferParamsValidatorErrors: Record<string, errorType> = {
  ErrorUserInfo: {
    name: 'ErrorUserInfo',
    message: 'Impossible to get user info from db',
    httpCode: 500
  },
  ErrorCurrencyType: {
    name: 'ErrorCurrencyType',
    message: 'wrong type of currency',
    httpCode: 400
  },
  ErrorInvalidAmount: {
    name: 'ErrorInvalidAmount',
    message: 'Error - The transfer amount should be a number and >= 1',
    httpCode: 400
  },
  ErrorInsufficientFunds: {
    name: 'ErrorInsufficientFunds',
    message: "Error - Insufficient funds in giver's wallet",
    httpCode: 400
  }
} as const

export const transferMoneyWithRetryErrors: Record<string, errorType> = {
  ErrorMaxRetry: {
    name: 'ErrorMaxRetry',
    message: 'Transfer failed - Max retry attempt reached',
    httpCode: 400
  }
} as const
