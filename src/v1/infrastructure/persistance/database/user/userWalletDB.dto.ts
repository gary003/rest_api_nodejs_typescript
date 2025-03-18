import { userWalletDTO } from '../../../../services/user/dto'

export type userWalletDBDTO = userWalletDTO

export type userWalletFromTableDB = {
  user_id: string
  firstname: string
  lastname: string
  Wallet: { wallet_id: string; hard_currency: number; soft_currency: number }
}

export type userWalletFromTableDBStream = {
  user_user_id: string
  user_firstname: string
  user_lastname: string
  wallet_user_id: string
  wallet_wallet_id: string
  wallet_hard_currency: number
  wallet_soft_currency: number
}
