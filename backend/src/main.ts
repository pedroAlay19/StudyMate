import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Puertos de Vite/React
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  // Servir archivos estáticos de la carpeta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  
  await app.listen(process.env.PORT ?? 3007);
}
void bootstrap();
