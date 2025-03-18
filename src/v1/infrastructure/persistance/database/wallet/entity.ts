import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'
import { Customer } from '../customer/entity'

@Entity()
export class Wallet {
  @PrimaryColumn('varchar')
  wallet_id!: string

  @Column('int')
  hard_currency!: number

  @Column('int')
  soft_currency!: number

  @Index('idx_wallet_customer_id')
  @OneToOne(() => Customer, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'customer_id',
    referencedColumnName: 'customer_id'
  })
  customer!: Customer
}
