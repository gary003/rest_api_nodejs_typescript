import { wallet } from "../../domain"

export type userWalletDTO = {
  userId: string
  firstname: string
  lastname: string
  Wallet?: wallet
}
