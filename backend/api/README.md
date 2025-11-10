# Sistema de Gestion de Turnos e Inspeccion de Vehiculos - Backend API

API REST desarrollada con NestJS para la gestion de turnos de inspeccion vehicular.
Permite a los duenos solicitar y confirmar turnos, y a los inspectores realizar inspecciones con checklist de 8 puntos

Tecnologias Utilizadas

Framework: NestJS v11.0.1, TypeScript v5.7.3, Node.js
Base de datos: PostgreSQL con Prisma ORM
Autenticacion: JWT, Passport (local y JWT strategies)
Validacion: class-validator, class-transformer
Documentacion: Swagger/OpenAPI

Arquitectura

Arquitectura orientada a servicios con separacion de responsabilidades:
- Controllers: Manejan peticiones HTTP
- Services: Logica de negocio
- DTOs: Validacion de datos
- Guards: Proteccion de rutas y permisos
- Modules: AuthModule, UsersModule, VehiculosModule, TurnosModule, ChecklistTemplatesModule, InspeccionesModule, PrismaModule

Requerimientos Funcionales

1. Solicitud de turno: POST /turnos
2. Ingreso de matricula: Usuario registra vehiculo con patente (POST /vehiculos) antes de solicitar turno
3. Disponibilidad de turnos: GET /turnos/disponibilidad genera horarios disponibles (9:00-17:00, lunes a viernes)
4. Confirmacion: PATCH /turnos/:id/confirmar cambia estado de PENDING a CONFIRMED
5. Inspeccion: POST /inspecciones y POST /inspecciones/:id/puntajes (solo INSPECTOR)
6. Puntuacion 1-10: Validado con @Min(1) y @Max(10)
7. Reglas de evaluacion: 
    >= 80 puntos SAFE
    < 40 puntos RECHECK, 
    < 5 puntos en item RECHECK
    Implementado en DefaultRuleEvaluator
8. Checklist de 8 puntos: Validado en creacion y finalizacion de inspecciones

Base de Datos
Modelos: User, Role, Vehicle, Appointment, ChecklistTemplate, ChecklistItemDefinition, Inspection, InspectionItemScore
Estados: AppointmentState (PENDING, CONFIRMED, CANCELLED), InspectionResult (SAFE, RECHECK), RoleName (OWNER, INSPECTOR, ADMIN)

Variables de Entorno
Crear archivo .env en backend/api/:


# Instalacion

1. Instalar dependencias:
cd backend/api
npm install

2. Configurar base de datos:
Crear base de datos PostgreSQL y configurar DATABASE_URL en .env

3. Ejecutar migraciones:
npx prisma migrate deploy

4. Poblar datos iniciales:
npx prisma db seed
Crea roles, usuarios demo (owner@mail.com, inspector@mail.com, admin@mail.com con password demo123), plantilla de checklist y datos de ejemplo

5. Compilar:
npm run build

6. Ejecutar:
npm run start:dev (desarrollo)
npm run start:prod (produccion)


# Deployment en Servidor

1. Clonar y construir:
git clone https://github.com/carlos-canavides/TurneroVehiculos.git
cd backend/api
npm install
npm run build

2. Configurar base de datos:
npx prisma migrate deploy

3. Iniciar aplicacion con PM2:
npm install -g pm2
pm2 start dist/main.js --name turnero-api

O directamente:
npm run start:prod


# Documentacion API

Swagger disponible en http://localhost:3000/api

# Seguridad

Contraseñas hasheadas con bcrypt
Tokens JWT con expiracion configurable
Rutas protegidas con guards de autenticacion y autorizacion
Validacion de datos con class-validator
CORS configurado para origenes especificos

Justificacion de Tecnologias

NestJS: Framework robusto, escalable, arquitectura modular, soporte TypeScript, integracion con herramientas modernas
PostgreSQL: Base de datos relacional robusta, transacciones ACID, buen rendimiento, amplia adopcion
Prisma ORM: Type-safety en compilacion, migraciones automaticas, cliente TypeScript generado, facilita desarrollo