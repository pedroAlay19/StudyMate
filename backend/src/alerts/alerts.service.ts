import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { TasksService } from '../tasks/tasks.service';
import dayjs from 'dayjs';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertsRepository: Repository<Alert>,

    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async create() {
    this.logger.log('Revisando tareas ...');
    await this.generateAlerts();
  }

  async generateAlerts() {
    const alertDayStart = dayjs().startOf('day').toDate();
    const alertDayEnd = dayjs().add(5, 'day').endOf('day').toDate();

    const tasks = await this.tasksService.findByAlertRange(
      alertDayStart,
      alertDayEnd,
    );
    if (!tasks.length) {
      this.logger.log('No hay tareas proximas a vencer');
      return;
    }

    this.logger.log(`Encontradas ${tasks.length} tareas próximas a vencer`);

    for (const task of tasks) {
      const deliveryDate = dayjs(task.delivery_date).startOf('day');
      const today = dayjs().startOf('day');
      const daysUntilDue = deliveryDate.diff(today, 'day');

      this.logger.log(`Procesando tarea: ${task.title}, vence en ${daysUntilDue} días`);

      // Crear alerta para cualquier tarea que venza en 5 días o menos
      if (daysUntilDue >= 0 && daysUntilDue <= 5) {
        // Verificar si ya existe una alerta para esta tarea y este día usando query builder
        const existingAlert = await this.alertsRepository
          .createQueryBuilder('alert')
          .innerJoin('alert.task', 'task')
          .where('task.task_id = :taskId', { taskId: task.task_id })
          .andWhere('DATE(alert.alertDate) = DATE(:today)', { today: today.toDate() })
          .getOne();

        if (!existingAlert) {
          const newAlert = this.alertsRepository.create({
            task: task,
            alertDate: today.toDate(),
            message: `La tarea "${task.title}" vence en ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}.`,
          });
          
          await this.alertsRepository.save(newAlert);
          this.logger.log(`✓ Alerta creada para tarea ${task.title} (${daysUntilDue} días restantes)`);
        } else {
          this.logger.log(`Alerta ya existe para tarea ${task.title}`);
        }
      }
    }
  }

  findAlertsByUserId(userId: string) {
    return this.alertsRepository.find({
      where: { task: { subject: { student: { studentId: userId } } } },
      relations: ['task', 'task.subject'],
      order: { alertDate: 'DESC' },
    });
  }

  async generateAlertForTask(task: any) {
    const deliveryDate = dayjs(task.delivery_date).startOf('day');
    const today = dayjs().startOf('day');
    
    // Calcular días hasta la fecha de entrega
    const daysUntilDue = deliveryDate.diff(today, 'day');
    
    this.logger.log(`GenerateAlertForTask: ${task.title}, vence en ${daysUntilDue} días`);
    
    // Si la tarea vence en 5 días o menos, crear alerta inmediatamente
    if (daysUntilDue >= 0 && daysUntilDue <= 5) {
      // Verificar si ya existe una alerta para esta tarea y fecha usando query builder
      const existingAlert = await this.alertsRepository
        .createQueryBuilder('alert')
        .innerJoin('alert.task', 'task')
        .where('task.task_id = :taskId', { taskId: task.task_id })
        .andWhere('DATE(alert.alertDate) = DATE(:today)', { today: today.toDate() })
        .getOne();

      if (!existingAlert) {
        const alert = this.alertsRepository.create({
          task: task,
          alertDate: today.toDate(),
          message: `La tarea "${task.title}" vence en ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}.`,
        });
        
        await this.alertsRepository.save(alert);
        this.logger.log(`✓ Alerta creada para tarea ${task.title} (${daysUntilDue} días restantes)`);
      } else {
        this.logger.log(`Alerta ya existe para tarea ${task.title}`);
      }
    } else {
      this.logger.log(`Tarea ${task.title} está fuera del rango de alertas (${daysUntilDue} días)`);
    }
  }
}
