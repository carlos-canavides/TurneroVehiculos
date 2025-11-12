# Sistema de Gestion de Turnos e Inspeccion de Vehiculos

### Levantar Todo con Docker Compose
Abre una terminal en la carpeta del proyecto y ejecutar:

```bash
docker compose up --build
```

## Esperar a que todo este listo
Durante este proceso:
- Se descarga la imagen de PostgreSQL que usamos como base de datos
- Se construyen las imagenes del backend y frontend
- Se ejecutan las migraciones de la base de datos
- Se ejecuta el seed (datos iniciales)

## Verificar que Todo Esté Corriendo

En **Docker Desktop** verificar los 3 contenedores corriendo:
- turnero_postgres
- turnero_backend
- turnero_frontend

## Acceder 
Una vez que todo esté corriendo:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Swagger (Documentación API)**: http://localhost:3000/api

## Detener Todo
```bash
docker compose down
```

O desde Docker Desktop: seleccionar los 3 contenedores y hacer clic en Stop.

## 👤 Usuarios de Prueba (del Seed)
El seed crea automáticamente estos usuarios:
- **Admin**: 
  - Email: admin@mail.com
  - Password: demo123

- **Owner (Dueño)**: 
  - Email: owner@mail.com
  - Password: demo123

- **Inspector**: 
  - Email: inspector@mail.com
  - Password: demo123
