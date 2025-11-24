import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { AlertsModule } from 'src/alerts/alerts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Subject]), forwardRef(() => AlertsModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
