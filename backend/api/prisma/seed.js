// backend/api/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1) Roles
  const roles = ['OWNER', 'INSPECTOR', 'ADMIN'];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },     // name es @unique en el schema
      update: {},
      create: { name: r },
    });
  }

  // 2) Usuarios demo (password = demo123)
  const hash = await bcrypt.hash('demo123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@mail.com' },
    update: {},
    create: {
      name: 'Dueño Demo',
      email: 'owner@mail.com',
      password: hash,
      active: true,
    },
  });

  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@mail.com' },
    update: {},
    create: {
      name: 'Inspector Demo',
      email: 'inspector@mail.com',
      password: hash,
      active: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mail.com' },
    update: {},
    create: {
      name: 'Admin Demo',
      email: 'admin@mail.com',
      password: hash,
      active: true,
    },
  });

  // 3) Asignación de roles (N:M)
  const roleByName = (name) => prisma.role.findFirst({ where: { name } });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: owner.id, roleId: (await roleByName('OWNER')).id },
    },
    update: {},
    create: { userId: owner.id, roleId: (await roleByName('OWNER')).id },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: inspector.id, roleId: (await roleByName('INSPECTOR')).id },
    },
    update: {},
    create: { userId: inspector.id, roleId: (await roleByName('INSPECTOR')).id },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: (await roleByName('ADMIN')).id },
    },
    update: {},
    create: { userId: admin.id, roleId: (await roleByName('ADMIN')).id },
  });

  // 4) Vehículo demo
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: 'ABC123' },
    update: {},
    create: {
      plate: 'ABC123',
      ownerId: owner.id,
    },
  });

  // 5) Plantilla de 8 puntos (sin setear id; Prisma genera UUID)
  let template = await prisma.checklistTemplate.findFirst({
    where: { name: 'Básica 8 Puntos' },
  });
  if (!template) {
    template = await prisma.checklistTemplate.create({
      data: { name: 'Básica 8 Puntos', active: true },
    });
  }

  // Ítems 1..8 con clave única compuesta (templateId, ord)
  const labels = [
    'Frenos',
    'Luces',
    'Neumáticos',
    'Suspensión',
    'Dirección',
    'Vidrios y Espejos',
    'Cinturones',
    'Emisiones/Contaminación',
  ];

  for (let i = 0; i < labels.length; i++) {
    await prisma.checklistItemDefinition.upsert({
      where: {
        // Prisma genera un input único llamado templateId_ord
        templateId_ord: { templateId: template.id, ord: i + 1 },
      },
      update: { label: labels[i] },
      create: {
        templateId: template.id,
        label: labels[i],
        ord: i + 1,
      },
    });
  }

  // 6) Turno de ejemplo PENDING
  await prisma.appointment.create({
    data: {
      vehicleId: vehicle.id,
      requesterId: owner.id,
      inspectorId: inspector.id,
      templateId: template.id,
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
      state: 'PENDING',
    },
  });

  console.log('Seed OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
