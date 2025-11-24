import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { JwtPayload } from '@supabase/supabase-js';
import { AlertsService } from '../alerts/alerts.service';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,

    @Inject(forwardRef(() => AlertsService))
    private readonly alertsService: AlertsService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const subject = await this.subjectRepository.findOne({
      where: { subjectId: createTaskDto.subjectId }
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${createTaskDto.subjectId} not found`);
    }

    // Validación adicional en el servicio
    const startDate = typeof createTaskDto.start_date === 'string'
      ? new Date(createTaskDto.start_date + 'T00:00:00')
      : new Date(createTaskDto.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const deliveryDate = typeof createTaskDto.delivery_date === 'string'
      ? new Date(createTaskDto.delivery_date + 'T00:00:00')
      : new Date(createTaskDto.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (deliveryDate < startDate) {
      throw new BadRequestException('Delivery date must be equal to or after start date');
    }

    let task = this.taskRepository.create({
      ...createTaskDto,
      subjectId: createTaskDto.subjectId,
      subject 
    });

    task = await this.taskRepository.save(task);
    await this.alertsService.generateAlertForTask(task);
    return task;
  }

  async findAll(user: JwtPayload): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { subject: { student: { studentId: user.sub } } },
      relations: ['subject'],
    });
  }

  async findByAlertRange(start: Date, end: Date) {
  return await this.taskRepository.find({
    where: { delivery_date: Between(start, end) },
  });
}

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { task_id: id },
      relations: ['subject'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async findBySubject(subjectId: string): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { subject: { subjectId } },
      relations: ['subject'],
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Si se está actualizando la materia, verificar que existe
    if (updateTaskDto.subjectId && updateTaskDto.subjectId !== task.subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: { subjectId: updateTaskDto.subjectId }
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${updateTaskDto.subjectId} not found`);
      }

      task.subject = subject;
      task.subjectId = updateTaskDto.subjectId;
    }

    // Validar fechas si se están actualizando
    if (updateTaskDto.start_date || updateTaskDto.delivery_date) {
      const startDate = updateTaskDto.start_date ? new Date(updateTaskDto.start_date) : new Date(task.start_date);
      const deliveryDate = updateTaskDto.delivery_date ? new Date(updateTaskDto.delivery_date) : new Date(task.delivery_date);
      
      if (deliveryDate < startDate) {
        throw new BadRequestException('Delivery date must be equal to or after start date');
      }
    }

    Object.assign(task, updateTaskDto);

    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  

}
