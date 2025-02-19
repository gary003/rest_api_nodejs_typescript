import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryColumn('varchar')
  userId!: string

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
