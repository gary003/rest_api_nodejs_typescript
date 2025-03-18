import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryColumn('varchar')
  user_id!: string

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
