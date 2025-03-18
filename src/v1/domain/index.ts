export const moneyTypesO = {
  hard_currency: 'hardCurrency',
  soft_currency: 'softCurrency'
} as const

export const moneyTypesO2 = {
  hardCurrency: 'hard_currency',
  softCurrency: 'soft_currency'
} as const

export type moneyTypes = (typeof moneyTypesO)[keyof typeof moneyTypesO]
