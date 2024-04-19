import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm"
import { User } from "../user/entity"

@Entity()
export class Wallet {
  @PrimaryColumn({ name: "walletId" })
  walletId: string

  @Column("int")
  hardCurrency: number

  @Column("int")
  softCurrency: number

  @OneToOne(() => User, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({
    name: "userId",
    referencedColumnName: "userId",
  })
  user: User
}
