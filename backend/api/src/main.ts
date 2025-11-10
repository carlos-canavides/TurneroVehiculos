import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Turnos e Inspección de Vehículos')
    .setDescription('API para gestión de turnos, vehículos e inspecciones')
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
      'JWT-auth', // Este nombre se usará en los decoradores @ApiBearerAuth
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
      persistAuthorization: true, // Mantiene el token al recargar la página
    },
    customSiteTitle: 'API - Sistema de Turnos e Inspecciones',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${process.env.PORT || 3000}`);
  console.log(`📚 Swagger UI disponible en: http://localhost:${process.env.PORT || 3000}/api`);
}
bootstrap();
