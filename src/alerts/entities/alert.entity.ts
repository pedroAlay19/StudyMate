import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  alertId: string;

  @Column({ type: 'timestamp' })
  alertDate: Date;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Task, (task) => task.alerts, {
    onDelete: 'CASCADE',
  })
  task: Task;
}

