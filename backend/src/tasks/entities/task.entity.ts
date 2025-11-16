import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Alert } from '../../alerts/entities/alert.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';

export enum TaskState {
  PENDING = 'pending', // Por hacer
  IN_PROGRESS = 'in_progress', // En progreso
  COMPLETED = 'completed', // Completada
  CANCELLED = 'cancelled', // Cancelada
}

export enum TaskPriority {
  LOW = 'low', // Baja
  MEDIUM = 'medium', // Media
  HIGH = 'high', // Alta
  URGENT = 'urgent', // Urgente
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  task_id: string;

  @ManyToOne(() => Subject, (subject) => subject.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  notes: string;

  @Column()
  start_date: Date;

  @Column()
  delivery_date: Date;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskState,
    default: TaskState.PENDING,
  })
  state: TaskState;

  @OneToMany(() => Alert, (alert) => alert.task)
  alerts: Alert[];

  @OneToMany(() => Attachment, (attachment) => attachment.task, {
    cascade: true,
  })
  attachments: Attachment[];

  @OneToMany(() => PromodoroSession, (session) => session.task, {
    cascade: true,
  })
  pomodoroSessions: PromodoroSession[];
}

import { PromodoroSession } from '../../pomodoro/entities/pomodoro-session.entity';
