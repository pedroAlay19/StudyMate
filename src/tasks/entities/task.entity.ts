import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';

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

    @Column()
    start_date: Date;

    @Column()
    delivery_date: Date;

    @Column()
    priority: string;

    @Column()
    state: string;
}