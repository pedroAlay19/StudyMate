import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: [
      'https://studymate-front-275736197450.northamerica-south1.run.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://*.run.app',
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Puerto para Cloud Run
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');   
  console.log(`Server running on port ${port}`);
}

void bootstrap();
