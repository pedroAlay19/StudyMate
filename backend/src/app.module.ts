import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TasksModule } from './tasks/tasks.module';
import { AlertsModule } from './alerts/alerts.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SupabaseModule } from './supabase/supabase.module'; // 🆕
import { AuthModule } from './auth/auth.module';
import { PromodoroModule } from './pomodoro/pomodoro.module'; // 🆕
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, 
      ssl: { rejectUnauthorized: false },
    }),
    UsersModule,
    SubjectsModule,
    TasksModule,
    AlertsModule,
    AttachmentsModule,
    SupabaseModule,
    AuthModule,
    PromodoroModule,
  ],
})
export class AppModule {}
