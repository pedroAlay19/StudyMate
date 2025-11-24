import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { UserRole } from './user.role';

@Entity('users')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  studentId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({type: 'enum', enum: UserRole, default: UserRole.STUDENT, nullable: true})
  role: UserRole

  @Column({ default: true })
  active: boolean;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Subject, (subject) => subject.student)
  subjects: Subject[];
}
