export enum walletAttributes {
  WALLETID = 'walletId',
  softCurrency = 'softCurrency',
  hardCurrency = 'hardCurrency'
}

export type walletDBInfo = Record<walletAttributes, string | number>
