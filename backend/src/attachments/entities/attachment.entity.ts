import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  attachmentId: string;

  @Column()
  fileName: string; // Nombre guardado en el servidor: "file-123456789.pdf"

  @Column()
  originalName: string; // Nombre original del archivo: "documento.pdf"

  @Column()
  fileUrl: string; // Ruta o URL del archivo: "/uploads/file-123456789.pdf"

  @Column()
  mimeType: string; // Tipo MIME: "application/pdf", "image/png", etc.

  @Column({ type: 'bigint' })
  fileSize: number; // Tamaño en bytes

  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt: Date;

  @ManyToOne(() => Task, (task) => task.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
