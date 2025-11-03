import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TasksModule } from 'src/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), TasksModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
