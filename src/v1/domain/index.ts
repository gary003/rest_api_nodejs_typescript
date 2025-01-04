export const moneyTypesO = {
  hard_currency: 'hardCurrency',
  soft_currency: 'softCurrency'
} as const

export type moneyTypes = (typeof moneyTypesO)[keyof typeof moneyTypesO]
