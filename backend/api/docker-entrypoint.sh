#!/bin/sh

echo "🚀 Iniciando aplicación..."

# Ejecutar migraciones
echo "📦 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

# Ejecutar seed solo si no hay datos (opcional, puedes comentar si no quieres seed automático)
echo "🌱 Ejecutando seed de base de datos..."
npx prisma db seed || echo "⚠️  Seed ya ejecutado o error en seed (continuando...)"

# Iniciar la aplicación
echo "✅ Iniciando servidor..."
exec node dist/src/main.js



