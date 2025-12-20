import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuración de CORS para Azure
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'https://studymate-frontend-app-cgh9hge2csdbhkeb.canadacentral-01.azurewebsites.net',
        'http://localhost:5173',
        'http://localhost:3000',
      ];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('⚠️  CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  

  app.useGlobalPipes(new ValidationPipe());

  // Puerto para Azure App Service
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ CORS enabled for origins:`, allowedOrigins);
}

void bootstrap();
