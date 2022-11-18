export enum userAttributes {
  USERID = "userId",
  FIRSTNAME = "firstname",
  LASTNAME = "lastname",
}

export enum walletAttributes {
  WALLETID = "walletId",
  SOFTCURRENCY = "softCurrency",
  // HARDCURRENCY = "hardCurrency",
}

export type userInfo = Record<userAttributes, string> & {
  Wallet: Record<walletAttributes, string | number>
}

// Ex
// const us: userInfo = {
//   userId: "14523564-0234-11ed-b939-0242ac120002",
//   firstname: "Glen",
//   lastname: "Rhee",
//   Wallet: {
//     walletId: "412cddd2-027d-11ed-b939-0242ac120002",
//     softCurrency: 750,
//   },
// }
