import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class Customer {
  @PrimaryColumn('varchar')
  customer_id!: string

  @Column({
    type: 'varchar',
    nullable: false
  })
  firstname!: string

  @Column({
    type: 'varchar',
    nullable: false
  })
  lastname!: string
}
