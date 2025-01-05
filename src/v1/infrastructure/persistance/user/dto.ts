import { walletDBInfo } from '../wallet/dto'

export const userAttributes = {
  USERID: 'userId',
  FIRSTNAME: 'firstname',
  LASTNAME: 'lastname'
} as const

// Create a type from the values
export type UserAttributeValues = (typeof userAttributes)[keyof typeof userAttributes]

export type userInfo = Record<UserAttributeValues, string> & {
  Wallet?: walletDBInfo
}
