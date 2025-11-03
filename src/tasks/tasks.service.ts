import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return await this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.find({
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

    Object.assign(task, updateTaskDto);

    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }
}
