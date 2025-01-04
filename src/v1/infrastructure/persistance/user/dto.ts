import { walletDBInfo } from '../wallet/dto'

export enum userAttributes {
  USERID = 'userId',
  FIRSTNAME = 'firstname',
  LASTNAME = 'lastname'
}

export type userInfo = Record<userAttributes, string> & {
  Wallet?: walletDBInfo
}

// Ex
// const us = {
//   userId: "14523564-0234-11ed-b939-0242ac120002",
//   firstname: "Glen",
//   lastname: "Rhee",
//   Wallet: {
//     walletId: "412cddd2-027d-11ed-b939-0242ac120002",
//     hardCurrency: 220,
//     softCurrency: 750,
//     coconut: 12,
//   },
// } as userInfo
