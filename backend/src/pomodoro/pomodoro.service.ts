import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePromodoroSessionDto } from './dto/create-pomodoro-session.dto';
import { UpdatePromodoroSessionDto } from './dto/update-pomodoro-session.dto';
import { PromodoroSession } from './entities/pomodoro-session.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class PromodoroService {
  constructor(
    @InjectRepository(PromodoroSession)
    private readonly pomodoroRepository: Repository<PromodoroSession>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createPromodoroSessionDto: CreatePromodoroSessionDto): Promise<PromodoroSession> {
    // Verificamos que la tarea existe
    const task = await this.taskRepository.findOne({
      where: { task_id: createPromodoroSessionDto.taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${createPromodoroSessionDto.taskId} not found`);
    }

    // Crear la sesión de Pomodoro
    const session = this.pomodoroRepository.create({
      ...createPromodoroSessionDto,
      task,
    });

    return await this.pomodoroRepository.save(session);
  }

  async findAll(userId: string): Promise<PromodoroSession[]> {
    return await this.pomodoroRepository.find({
      relations: ['task', 'task.subject', 'task.subject.student'],
      where: {
        task: {
          subject: {
            student: {
              studentId: userId,
            },
          },
        },
      },
      order: { start_session: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PromodoroSession> {
    const session = await this.pomodoroRepository.findOne({
      where: { session_id: id },
      relations: ['task'],
    });

    if (!session) {
      throw new NotFoundException(`Pomodoro session with ID ${id} not found`);
    }

    return session;
  }

  async findByTask(taskId: string, userId: string): Promise<PromodoroSession[]> {
    const task = await this.taskRepository.findOne({
      where: { task_id: taskId },
      relations: ['subject', 'subject.student'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Verificar que la tarea pertenece al estudiante autenticado
    if (task.subject.student.studentId !== userId) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return await this.pomodoroRepository.find({
      where: { task: { task_id: taskId } },
      relations: ['task'],
      order: { start_session: 'DESC' },
    });
  }

  async update(id: string, updatePromodoroSessionDto: UpdatePromodoroSessionDto): Promise<PromodoroSession> {
    const session = await this.findOne(id);

    // Validar que end_session sea posterior a start_session
    if (updatePromodoroSessionDto.end_session) {
      const endDate = new Date(updatePromodoroSessionDto.end_session);
      const startDate = new Date(session.start_session);

      if (endDate <= startDate) {
        throw new BadRequestException('End session must be after start session');
      }
    }

    Object.assign(session, updatePromodoroSessionDto);

    return await this.pomodoroRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.pomodoroRepository.remove(session);
  }

  //Estadisticas por tarea
  async getStatsByTask(taskId: string, userId: string) {
    const sessions = await this.findByTask(taskId, userId);

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed).length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_min, 0);
    const totalBreaks = sessions.reduce((sum, s) => sum + s.breaks_taken, 0);

    return {
      taskId,
      totalSessions,
      completedSessions,
      totalMinutes,
      totalBreaks,
      averageMinutesPerSession: totalSessions > 0 ? totalMinutes / totalSessions : 0,
    };
  }
}
