import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { Attachment } from './entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { SupabaseService } from '../supabase/supabase.service'; // 

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly supabaseService: SupabaseService, 
  ) {}

  // Método para subir a Supabase
  async uploadToSupabase(
    file: Express.Multer.File,
    taskId: string,
  ): Promise<Attachment> {
    // Validar tarea
    const task = await this.taskRepository.findOne({
      where: { task_id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    //  Sanitizar y generar nombre único
    // Remover acentos y caracteres especiales
    const sanitizedName = file.originalname
      .normalize('NFD') // Descomponer caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Reemplazar caracteres especiales con _

    const fileName = `${Date.now()}-${sanitizedName}`;
    const bucketName = 'studymate-attachments';

    // Subir a Supabase
    const { data, error } = await this.supabaseService
      .getClient()
      .storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(
        `Failed to upload to Supabase: ${error.message}`,
      );
    }

    // Obtener URL pública
    const { data: urlData } = this.supabaseService
      .getClient()
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Guardar en BD
    const attachment = this.attachmentRepository.create({
      fileName: fileName,
      originalName: file.originalname,
      fileUrl: urlData.publicUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      task,
    });

    return await this.attachmentRepository.save(attachment);
  }

  // Métodos existentes (create, findAll, etc.)
  async create(createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    const task = await this.taskRepository.findOne({
      where: { task_id: createAttachmentDto.taskId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${createAttachmentDto.taskId} not found`,
      );
    }

    const attachment = this.attachmentRepository.create({
      ...createAttachmentDto,
      task,
    });

    return await this.attachmentRepository.save(attachment);
  }

  async findAll(): Promise<Attachment[]> {
    return await this.attachmentRepository.find({
      relations: ['task'],
    });
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { attachmentId: id },
      relations: ['task'],
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  async findByTask(taskId: string): Promise<Attachment[]> {
    return await this.attachmentRepository.find({
      where: { task: { task_id: taskId } },
      relations: ['task'],
    });
  }

  async update(
    id: string,
    updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<Attachment> {
    const attachment = await this.findOne(id);
    Object.assign(attachment, updateAttachmentDto);
    return await this.attachmentRepository.save(attachment);
  }

  // ACTUALIZADO: Detectar si es Supabase o local
  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);

    // Detectar si es URL de Supabase
    if (attachment.fileUrl.includes('supabase')) {
      // Eliminar de Supabase
      const fileName = attachment.fileUrl.split('/').pop();
      
      if (!fileName) {
        throw new BadRequestException('Invalid file URL');
      }
      
      const { error } = await this.supabaseService
        .getClient()
        .storage
        .from('studymate-attachments')
        .remove([fileName]);

      if (error) {
        console.error(`Error deleting from Supabase: ${error.message}`);
      } else {
        console.log(`File deleted from Supabase: ${fileName}`);
      }
    } else {
      // Eliminar archivo local
      const filePath = join(process.cwd(), attachment.fileUrl);

      try {
        await unlink(filePath);
        console.log(`Local file deleted: ${filePath}`);
      } catch (error) {
        console.error(`Could not delete local file: ${error.message}`);
      }
    }

    // Siempre eliminar de BD
    await this.attachmentRepository.remove(attachment);
  }
}