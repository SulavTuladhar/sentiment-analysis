import { IsEmail } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./enum";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column({ type: "bigint" })
  number!: number;

  @Column()
  password!: string;

  @Column({ default: null })
  otp!: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role!: Role;
}
