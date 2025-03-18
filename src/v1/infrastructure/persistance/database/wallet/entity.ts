import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'
import { User } from '../user/entity'

@Entity()
export class Wallet {
  @PrimaryColumn('varchar')
  wallet_id!: string

  @Column('int')
  hard_currency!: number

  @Column('int')
  soft_currency!: number

  @Index('idx_wallet_user_id')
  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'user_id'
  })
  user!: User
}
