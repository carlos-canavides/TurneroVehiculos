# Frontend - Sistema de Gestión de Turnos

Frontend desarrollado con React + TypeScript + Vite para el sistema de gestión de turnos y control de estado de vehículos.

## Características

- ✅ Login con autenticación JWT
- ✅ Vistas según roles (OWNER, INSPECTOR, ADMIN)
- ✅ Gestión de vehículos (para OWNER)
- ✅ Gestión de turnos (para OWNER)
- ✅ Visualización de inspecciones (para INSPECTOR)

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto frontend:

```env
VITE_API_URL=http://localhost:3000
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Usuarios de Prueba

- **Owner**: `owner@mail.com` / `password`
- **Inspector**: `inspector@mail.com` / `password`
- **Admin**: `admin@mail.com` / `password`

## Estructura

```
src/
├── api/              # Clientes API
├── components/       # Componentes de dashboard por rol
├── contexts/         # Contextos de React (Auth)
├── pages/            # Páginas principales
└── App.tsx           # Componente principal con rutas
```
