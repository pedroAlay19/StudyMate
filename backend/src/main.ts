import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // app.enableCors({
  //   origin: [
  //     'https://studymate-frontend-app-cgh9hge2csdbhkeb.canadacentral-01.azurewebsites.net',
  //     'http://localhost:5173',
  //   ],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: 'Content-Type, Authorization',
  //   credentials: true,
  // });
  

  app.useGlobalPipes(new ValidationPipe());

  // Puerto para Cloud Run
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');   
  console.log(`Server running on port ${port}`);
}

void bootstrap();
