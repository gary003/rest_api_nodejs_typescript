import { wallet } from "../wallet/dto"

export enum moneyTypes {
  "hard_currency" = "hardCurrency",
  "soft_currency" = "softCurrency",
}

export type user = {
  userId: string
  firstname: string
  lastname: string
}

export type userWalletDTO = {
  userId: string
  firstname: string
  lastname: string
  Wallet: wallet
}
