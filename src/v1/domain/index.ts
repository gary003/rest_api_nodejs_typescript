export const moneyTypesO = {
  "hard_currency" : "hardCurrency",
  "soft_currency" : "softCurrency",
} as const

type moneyT = keyof typeof moneyTypesO

export type moneyTypes =(typeof moneyTypesO)[moneyT]

export type wallet = moneyTypes & {
  walletId: string
}
