import { errorType } from '../../domain/error'

export const transferMoneyErrors: Record<string, errorType> = {
  ErrorParamsValidator: {
    name: 'ErrorParamsValidator',
    message: 'Error - Failed to retrieve recipient - giver informations'
  } as const,
  ErrorLockAcquisition: {
    name: 'ErrorLockAcquisition',
    message: 'Error - Lock - Failed to acquire locks on wallets'
  } as const,
  ErrorTransactionCreation: {
    name: 'ErrorTransactionCreation',
    message: 'Error - Failed to create database transaction'
  } as const,
  ErrorUpdateGiverWallet: {
    name: 'ErrorUpdateGiverWallet',
    message: "Error - Failed to update giver's wallet balance"
  } as const,
  ErrorUpdateRecipientWallet: {
    name: 'ErrorUpdateRecipientWallet',
    message: "Error - Failed to update recipient's wallet balance"
  }
} as const

export const userFunctionsErrors: Record<string, errorType> = {
  ErrorRetrievingUsers: {
    name: 'ErrorRetrievingUsers',
    message: 'Error - Failed to retrieve users from database'
  } as const,
  ErrorGettingWalletInfo: {
    name: 'ErrorGettingWalletInfo',
    message: 'Error - no wallet ibfo found'
  } as const,
  ErrorNoWalletUser: {
    name: 'ErrorNoWalletUser',
    message: 'Error - User with no wallet'
  } as const,
  ErrorCreatingUser: {
    name: 'ErrorCreatingUser',
    message: 'Error - Failed to create a new user'
  } as const,
  ErrorUpdatingWallet: {
    name: 'ErrorUpdatingWallet',
    message: "Error - Failed to update user's wallet"
  } as const,
  ErrorDeletingUser: {
    name: 'ErrorDeletingUser',
    message: 'Error - Failed to delete user'
  } as const,
  ErrorFetchingUserInfo: {
    name: 'ErrorFetchingUserInfo',
    message: 'Error - Failed to fetch user information'
  } as const
} as const

export const moneyTransferParamsValidatorErrors: Record<string, errorType> = {
  ErrorUserInfo: {
    name: 'ErrorUserInfo',
    message: 'Impossible to get user info from db'
  },
  ErrorCurrencyType: {
    name: 'ErrorCurrencyType',
    message: 'wrong type of currency'
  },
  ErrorInvalidAmount: {
    name: 'ErrorInvalidAmount',
    message: 'Error - The transfer amount should be a number and >= 1'
  },
  ErrorInsufficientFunds: {
    name: 'ErrorInsufficientFunds',
    message: "Error - Insufficient funds in giver's wallet"
  }
} as const

export const transferMoneyWithRetryErrors: Record<string, errorType> = {
  ErrorMaxRetry: {
    name: 'ErrorMaxRetry',
    message: 'Transfer failed - Max retry attempt reached'
  }
} as const
