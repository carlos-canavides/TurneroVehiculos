import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend y Swagger
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuracion de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestion de Turnos e Inspeccion de Vehiculos')
    .setDescription('API para gestion de turnos, vehiculos e inspecciones')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usara en los decoradores @ApiBearerAuth
    )
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Usuarios')
    .addTag('vehiculos', 'Vehículos')
    .addTag('turnos', 'Turnos/Appointments')
    .addTag('checklist-templates', 'Plantillas de Checklist')
    .addTag('inspecciones', 'Inspecciones')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token al recargar la pagina
    },
    customSiteTitle: 'API - Sistema de Turnos e Inspecciones',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${process.env.PORT || 3000}`);
  console.log(`📚 Swagger UI disponible en: http://localhost:${process.env.PORT || 3000}/api`);
}
bootstrap();
