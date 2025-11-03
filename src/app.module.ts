import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'postgres',
      password: 'postgres',
      database: 'test',
      autoLoadEntities: true,
      synchronize: true, 
    }),
    UsersModule,
    SubjectsModule,
    TasksModule,
    ScheduleModule.forRoot(),
    AlertsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
