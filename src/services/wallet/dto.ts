export enum moneyTypes {
  "hard_currency" = "hardCurrency",
  "soft_currency" = "softCurrency",
}

export type wallet = Record<moneyTypes, string> & {
  walletId: string
}
