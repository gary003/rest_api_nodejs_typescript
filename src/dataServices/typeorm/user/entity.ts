import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Wallet } from "../wallet/entity"

@Entity()
export class User {
  @PrimaryColumn("varchar")
  userId: string

  @Column({
    type: "varchar",
    nullable: false,
  })
  firstname: string

  @Column({
    type: "varchar",
    nullable: false,
  })
  lastname: string
}
