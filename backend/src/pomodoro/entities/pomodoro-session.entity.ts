import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('pomodoro_sessions')
export class PromodoroSession {
  @PrimaryGeneratedColumn('uuid')
  session_id: string;

  @ManyToOne(() => Task, (task) => task.pomodoroSessions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn({ type: 'timestamp' })
  start_session: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_session: Date;

  @Column({ type: 'int', default: 25 })
  duration_min: number; //por defecto 25

  @Column({ type: "int", default: 5})
  break_time: number; //tiempo de descanso

  @Column({ type: 'int', default: 0 })
  breaks_taken: number; // descansos tomados

  @Column({ type: 'boolean', default: false })
  completed: boolean; // tecnica completada
}
