import { userWalletDTO } from '../../../../services/user/dto'

export type customerWalletDBDTO = userWalletDTO

export type customerWalletFromTableDB = {
  customer_id: string
  firstname: string
  lastname: string
  Wallet: { wallet_id: string; hard_currency: number; soft_currency: number }
}

export type customerWalletFromTableDBStream = {
  customer_customer_id: string
  customer_firstname: string
  customer_lastname: string
  wallet_customer_id: string
  wallet_wallet_id: string
  wallet_hard_currency: number
  wallet_soft_currency: number
}
