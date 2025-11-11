# Guia de Presentacion

## 1. Introduccion y Arquitectura

### Arquitectura Implementada
- Arquitectura orientada a servicios (SOA) con NestJS
- Separacion de responsabilidades: Controllers, Services, DTOs, Guards
- Base de datos relacional PostgreSQL con Prisma ORM
- API REST con documentacion Swagger

### Justificacion de Tecnologias
- NestJS: Framework robusto, escalable, arquitectura modular, soporte TypeScript
- PostgreSQL: Base de datos relacional robusta, transacciones ACID, buen rendimiento
- Prisma ORM: Type-safety, migraciones automaticas, facilita desarrollo
- JWT: Autenticacion stateless, escalable

## 2. Cumplimiento de Requerimientos Funcionales

### Requerimiento 1: Solicitud de Turno
IMPLEMENTACION:
- Endpoint: POST /turnos
- Flujo: Usuario dueno registra vehiculo con patente -> Solicita turno con vehicleId y fecha/hora
- Validaciones: Vehiculo debe pertenecer al usuario, fecha debe ser futura, debe existir checklist activo
- Codigo: turnos.service.ts -> metodo crear()

### Requerimiento 2: Ingreso de Matricula
IMPLEMENTACION:
- Endpoint: POST /vehiculos
- Flujo: Usuario primero registra su vehiculo con patente (formato ABC123 o AB123CD)
- Validacion: Patente unica en el sistema, formato validado con regex
- Codigo: vehiculos.service.ts -> metodo crear()

### Requerimiento 3: Disponibilidad de Turnos
IMPLEMENTACION:
- Endpoint: GET /turnos/disponibilidad
- Logica: Genera horarios disponibles de 9:00 a 17:00, lunes a viernes, excluyendo turnos ocupados (PENDING o CONFIRMED)
- Rango: Proximos 30 dias por defecto
- Codigo: turnos.service.ts -> metodo disponibilidad()

### Requerimiento 4: Confirmacion de Turno
IMPLEMENTACION:
- Endpoint: PATCH /turnos/:id/confirmar
- Flujo: Usuario confirma turno pendiente, cambia estado de PENDING a CONFIRMED
- Validacion: Solo turnos en estado PENDING pueden confirmarse
- Codigo: turnos.service.ts -> metodo confirmar()

### Requerimiento 5: Completado de Inspeccion por Inspector
IMPLEMENTACION:
- Endpoints: 
  - POST /inspecciones (crear inspeccion, solo INSPECTOR)
  - POST /inspecciones/:id/puntajes (agregar puntajes, solo INSPECTOR)
- Flujo: Inspector crea inspeccion sobre turno confirmado -> Agrega puntajes de 1-10 para cada item -> Finaliza inspeccion
- Validaciones: Turno debe estar CONFIRMED, plantilla debe tener 8 items, inspector debe tener rol INSPECTOR
- Codigo: inspecciones.service.ts -> metodos crear(), agregarPuntaje(), finalizar()

### Requerimiento 6: Puntuacion 1-10
IMPLEMENTACION:
- Validacion en DTO: @Min(1) @Max(10) en AgregarPuntajeDto
- Cada item del checklist se puntua de 1 a 10
- Codigo: inspecciones/dto/agregar-puntaje.dto.ts

### Requerimiento 7: Reglas de Evaluacion
IMPLEMENTACION:
- Regla 1: Si total >= 80 puntos -> SAFE (vehiculo seguro)
- Regla 2: Si total < 40 puntos -> RECHECK (debe rechequearse)
- Regla 3: Si algun item tiene < 5 puntos -> RECHECK (debe rechequearse)
- Inspector puede agregar observacion general al finalizar
- Codigo: inspecciones/evaluators/default-rule-evaluator.ts -> metodo evaluar()

### Requerimiento 8: Checklist de 8 Puntos
IMPLEMENTACION:
- Validacion en creacion de inspeccion: plantilla debe tener exactamente 8 items
- Validacion en finalizacion: deben haberse cargado los 8 puntajes
- Plantillas de checklist se configuran con 8 items obligatoriamente
- Codigo: inspecciones.service.ts -> validaciones en crear() y finalizar()

## 3. Limitaciones y Simplificaciones Realizadas

### Limitaciones de Negocio
1. Horarios fijos: Turnos solo de 9:00 a 17:00, lunes a viernes (no se contemplan horarios especiales o feriados)
2. Un turno por horario: No se permite mas de un turno en el mismo horario (no hay multiples inspectores)
3. Un inspector por turno: No se contempla asignacion automatica de inspectores, se asigna manualmente
4. Plantilla unica activa: Solo una plantilla de checklist puede estar activa a la vez
5. Sin notificaciones: No hay sistema de notificaciones por email o SMS
6. Sin historial de cambios: No se guarda historial de modificaciones de inspecciones

### Simplificaciones Tecnicas
1. Autenticacion basica: Solo JWT, sin refresh tokens
2. Sin paginacion: Las listas no tienen paginacion (funciona para pocos registros)
3. Sin busqueda avanzada: No hay filtros complejos en las consultas
4. Validacion de patente simple: Solo dos formatos (ABC123 y AB123CD), no contempla todos los formatos argentinos
5. Sin soft delete: Los registros se eliminan permanentemente
6. Sin auditoria: No se registra quien y cuando modifico cada registro

### Consideraciones de Escalabilidad
- La generacion de disponibilidad calcula todos los horarios en memoria (puede ser lento con muchos turnos)
- No hay cache de consultas frecuentes
- Sin indices adicionales optimizados para busquedas complejas

## 4. Caso de Prueba Completo: Flujo End-to-End

### Escenario: Inspeccion Completa de un Vehiculo

PASO 1: Registro de Usuario Dueno
- Crear usuario con rol OWNER (ya existe en seed: owner@mail.com / demo123)

PASO 2: Login del Dueno
- POST /auth/login
- Body: { "email": "owner@mail.com", "password": "demo123" }
- Respuesta: { "access_token": "eyJhbGci..." }
- Guardar token para usar en siguientes requests

PASO 3: Registrar Vehiculo (si no existe)
- POST /vehiculos
- Headers: Authorization: Bearer <token>
- Body: { "patente": "XYZ789", "alias": "Mi Auto" }
- Respuesta: { "id": "...", "plate": "XYZ789", "alias": "Mi Auto", ... }

PASO 4: Consultar Disponibilidad
- GET /turnos/disponibilidad
- Headers: Authorization: Bearer <token>
- Respuesta: { "horariosDisponibles": ["2025-11-15T10:00:00", ...], "total": 45 }
- Seleccionar un horario disponible

PASO 5: Solicitar Turno
- POST /turnos
- Headers: Authorization: Bearer <token>
- Body: { "vehicleId": "<id-del-vehiculo>", "scheduledAt": "2025-11-15T10:00:00" }
- Respuesta: { "id": "...", "state": "PENDING", "dateTime": "2025-11-15T10:00:00", ... }

PASO 6: Confirmar Turno
- PATCH /turnos/<turno-id>/confirmar
- Headers: Authorization: Bearer <token>
- Respuesta: { "id": "...", "state": "CONFIRMED", ... }

PASO 7: Login del Inspector
- POST /auth/login
- Body: { "email": "inspector@mail.com", "password": "demo123" }
- Respuesta: { "access_token": "eyJhbGci..." } (token diferente)

PASO 8: Ver Turnos Disponibles para Inspeccion
- GET /turnos/confirmados-disponibles
- Headers: Authorization: Bearer <token-inspector>
- Respuesta: Lista de turnos CONFIRMED sin inspeccion

PASO 9: Crear Inspeccion
- POST /inspecciones
- Headers: Authorization: Bearer <token-inspector>
- Body: { "turnoId": "<turno-id>" }
- Respuesta: { "id": "...", "total": 0, "result": "SAFE", "scores": [] }

PASO 10: Agregar Puntajes (8 items)
- POST /inspecciones/<inspeccion-id>/puntajes
- Headers: Authorization: Bearer <token-inspector>
- Repetir 8 veces, una por cada item:
  - Body 1: { "itemId": "<item-1-id>", "valor": 9, "nota": "Excelente estado" }
  - Body 2: { "itemId": "<item-2-id>", "valor": 8, "nota": "Buen estado" }
  - Body 3: { "itemId": "<item-3-id>", "valor": 10, "nota": "Perfecto" }
  - Body 4: { "itemId": "<item-4-id>", "valor": 9, "nota": "Muy bien" }
  - Body 5: { "itemId": "<item-5-id>", "valor": 8, "nota": "Correcto" }
  - Body 6: { "itemId": "<item-6-id>", "valor": 9, "nota": "Bien" }
  - Body 7: { "itemId": "<item-7-id>", "valor": 10, "nota": "Excelente" }
  - Body 8: { "itemId": "<item-8-id>", "valor": 9, "nota": "Muy bueno" }
- Total acumulado: 72 puntos

PASO 11: Finalizar Inspeccion
- PATCH /inspecciones/<inspeccion-id>/finalizar
- Headers: Authorization: Bearer <token-inspector>
- Body: { "observacionGeneral": "Vehiculo en buen estado general. Revisar item 2 y 5 en proxima inspeccion." }
- Respuesta: { "id": "...", "total": 72, "result": "RECHECK", "note": "...", ... }
- Resultado: RECHECK porque total (72) < 80, aunque no hay items criticos (< 5)

PASO 12: Verificar Resultado
- GET /inspecciones/<inspeccion-id>
- Headers: Authorization: Bearer <token-inspector>
- Respuesta: Inspeccion completa con todos los puntajes, total, resultado y observaciones

### Caso Alternativo: Vehiculo Seguro (SAFE)

Si en el PASO 10 se asignan puntajes que sumen >= 80:
- Ejemplo: 10, 10, 10, 10, 10, 10, 10, 10 = 80 puntos
- Resultado: SAFE (vehiculo seguro)

### Caso Alternativo: Item Critico (RECHECK)

Si en el PASO 10 algun item tiene < 5 puntos:
- Ejemplo: Item 1 con valor 4, resto con 10 = 74 puntos total
- Resultado: RECHECK (aunque el total sea >= 40, hay item critico)

## 6. Diagrama de Flujo del Sistema

```
Usuario Dueno:
1. Login -> Obtiene token JWT
2. Registrar vehiculo (patente)
3. Consultar disponibilidad
4. Solicitar turno (PENDING)
5. Confirmar turno (CONFIRMED)

Inspector:
1. Login -> Obtiene token JWT
2. Ver turnos confirmados disponibles
3. Crear inspeccion
4. Agregar 8 puntajes (1-10 cada uno)
5. Finalizar inspeccion -> Sistema evalua reglas:
   - Total >= 80 -> SAFE
   - Total < 40 -> RECHECK
   - Item < 5 -> RECHECK
6. Resultado + observaciones guardadas
```

## 7. Preguntas Frecuentes para la Defensa

P: ¿Por que NestJS y no Express?
R: NestJS ofrece arquitectura modular, TypeScript nativo, inyeccion de dependencias, y facilita el mantenimiento y escalabilidad.

P: ¿Por que PostgreSQL y no MongoDB?
R: PostgreSQL es relacional, garantiza integridad referencial, soporta transacciones ACID, y es adecuado para relaciones complejas entre entidades.

P: ¿Como se manejan los errores?
R: NestJS maneja excepciones automaticamente. Usamos excepciones HTTP estandar (NotFoundException, BadRequestException, ForbiddenException) con mensajes descriptivos.

P: ¿Que pasa si un inspector intenta modificar una inspeccion de otro?
R: Validacion en inspecciones.service.ts verifica que inspectorId coincida. Si no, lanza ForbiddenException.

P: ¿Como se garantiza que siempre haya 8 items?
R: Validaciones en checklist-templates.service.ts (maximo 8 items), inspecciones.service.ts (verifica 8 items al crear y finalizar).

P: ¿El sistema es escalable?
R: Arquitectura modular permite agregar funcionalidades. Para alta concurrencia se podrian agregar cache, colas de mensajeria, y optimizaciones de base de datos.

## 8. Comandos para Demostracion

### Iniciar servidor
cd backend/api
npm run start:dev

### Acceder a Swagger
http://localhost:3000/api

### Seed de datos (si es necesario)
npx prisma db seed

### Ver estructura de base de datos
npx prisma studio

## 9. Checklist Pre-Defensa

- [ ] Servidor corriendo
- [ ] Base de datos con datos de seed
- [ ] Swagger accesible
- [ ] Token de dueno obtenido
- [ ] Token de inspector obtenido
- [ ] Caso de prueba documentado
- [ ] Postman/Thunder Client con requests guardados (opcional)
- [ ] Diagrama de arquitectura (opcional)
- [ ] README actualizado