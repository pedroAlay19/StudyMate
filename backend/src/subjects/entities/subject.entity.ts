import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,JoinColumn } from 'typeorm';
import { Student } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

export interface ScheduleItem {
  day: string;
  start: string;
  end: string;
}

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  subjectId: string;

  @ManyToOne(() => Student, (student) => student.subjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' }) 
  student: Student;

  @OneToMany(() => Task, (task) => task.subject)
  tasks: Task[];

  @Column()
  name: string;

  @Column()
  assignedTeacher: string;

  @Column({ type: 'json', nullable: true })
  schedule: ScheduleItem[];

  @Column()
  color: string;
}
