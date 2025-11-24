import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Crea una instancia de la aplicación para pruebas e2e
 */
export async function createTestApp(): Promise<INestApplication> {
  // Configurar NODE_ENV para testing
  process.env.NODE_ENV = 'test';
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Configurar ValidationPipe como en main.ts
  app.useGlobalPipes(new ValidationPipe());
  
  await app.init();
  
  return app;
}

/**
 * Limpia las tablas de la base de datos de pruebas
 * Orden específico para evitar errores de foreign key
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  
  // Limpiar en orden específico para evitar violaciones de foreign key
  const tablesToClean = [
    'pomodoro_sessions',
    'alert',
    'attachments',
    'tasks',
    'subjects',
    'users',
  ];

  for (const table of tablesToClean) {
    try {
      await dataSource.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    } catch (error) {
      // Ignorar errores si la tabla no existe
      console.log(`Warning: Could not truncate table ${table}`);
    }
  }
}

/**
 * Cierra la aplicación y limpia recursos
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
