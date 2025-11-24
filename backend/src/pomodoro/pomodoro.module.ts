import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromodoroService } from './pomodoro.service';
import { PromodoroController } from './pomodoro.controller';
import { PromodoroSession } from './entities/pomodoro-session.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PromodoroSession, Task])],
  controllers: [PromodoroController],
  providers: [PromodoroService],
  exports: [PromodoroService],
})
export class PromodoroModule {}
