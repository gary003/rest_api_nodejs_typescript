export enum walletAttributes {
  WALLETID = "walletId",
  SOFTCURRENCY = "softCurrency",
  // HARDCURRENCY = "hardCurrency",
}

export type walletDBInfo = Record<walletAttributes, string | number>
