/* eslint-disable no-unused-vars */
export enum walletAttributes {
  WALLETID = 'walletId',
  softCurrency = 'softCurrency',
  hardCurrency = 'hardCurrency'
}
/* eslint-enable no-unused-vars */

export type walletDBInfo = Record<walletAttributes, string | number>
