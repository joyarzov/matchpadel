import { PrismaClient, PlayerCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed admin user
  const adminEmail = 'admin@padelmatch.cl';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'MatchPadel',
        phone: '+56912345678',
        category: PlayerCategory.TERCERA,
        gender: 'MALE',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created: admin@padelmatch.cl / Admin123!');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Borrar clubes ficticios anteriores
  await prisma.matchPlayer.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.court.deleteMany({});
  await prisma.club.deleteMany({});
  console.log('Datos anteriores limpiados.');

  // Seed clubes reales de Valdivia
  const clubsData = [
    {
      name: 'Casa Pádel Valdivia',
      address: 'Sevilla 285, Las Ánimas, Valdivia',
      city: 'Valdivia',
      region: 'Los Ríos',
      phone: '+56931896933',
      email: null,
      imageUrl: 'http://casapadel-cl.matchpoint.com.es/CasaPadelValdivia/img/logo.png',
      latitude: -39.8355,
      longitude: -73.2290,
      matchpointDomain: 'casapadel-cl.matchpoint.com.es',
      courts: [
        { number: 1, name: 'Socovesa', isIndoor: false, surface: 'césped sintético' },
        { number: 2, name: 'Cancha 2', isIndoor: false, surface: 'césped sintético' },
        { number: 3, name: 'Cancha 3', isIndoor: false, surface: 'césped sintético' },
        { number: 4, name: 'Cancha 4', isIndoor: false, surface: 'césped sintético' },
      ],
    },
    {
      name: 'Espacio Pádel - Las Ánimas',
      address: 'Pedro Aguirre Cerda 05, Las Ánimas, Valdivia',
      city: 'Valdivia',
      region: 'Los Ríos',
      phone: '+56991270872',
      email: null,
      imageUrl: null,
      latitude: -39.8370,
      longitude: -73.2320,
      matchpointDomain: null,
      easycanchaClubId: 400,
      courts: [
        { number: 1, name: 'Cancha 1', isIndoor: false, surface: 'césped sintético' },
        { number: 2, name: 'Cancha 2', isIndoor: false, surface: 'césped sintético' },
      ],
    },
    {
      name: 'Espacio Pádel - Paillao',
      address: 'Camino a Paillao, Pasaje Lahual, Parcela 4, Valdivia',
      city: 'Valdivia',
      region: 'Los Ríos',
      phone: '+56940621758',
      email: null,
      imageUrl: null,
      latitude: -39.7950,
      longitude: -73.2100,
      matchpointDomain: null,
      easycanchaClubId: 1128,
      courts: [
        { number: 1, name: 'Cancha 1', isIndoor: false, surface: 'césped sintético' },
        { number: 2, name: 'Cancha 2', isIndoor: false, surface: 'césped sintético' },
        { number: 3, name: 'Cancha 3', isIndoor: false, surface: 'césped sintético' },
        { number: 4, name: 'Cancha 4', isIndoor: false, surface: 'césped sintético' },
      ],
    },
    {
      name: 'Las Marías Pádel',
      address: 'Av. España s/n, Aeródromo Las Marías, Valdivia',
      city: 'Valdivia',
      region: 'Los Ríos',
      phone: '+56949072308',
      email: 'clublasmariaspadel@gmail.com',
      imageUrl: 'http://lasmariaspadel.matchpoint.com.es/LasMariasPadel/img/logo.png',
      latitude: -39.7990,
      longitude: -73.2560,
      matchpointDomain: 'lasmariaspadel.matchpoint.com.es',
      courts: [
        { number: 1, name: 'Cancha 1', isIndoor: false, surface: 'césped sintético' },
        { number: 2, name: 'Cancha 2', isIndoor: false, surface: 'césped sintético' },
        { number: 3, name: 'Cancha 3', isIndoor: false, surface: 'césped sintético' },
      ],
    },
    {
      name: 'River Padel Valdivia',
      address: 'Arica 2753, Valdivia',
      city: 'Valdivia',
      region: 'Los Ríos',
      phone: '+56975798007',
      email: 'riverapadelvaldivia@gmail.com',
      imageUrl: null,
      latitude: -39.8200,
      longitude: -73.2450,
      matchpointDomain: 'riverpadelcl.matchpoint.com.es',
      courts: [
        { number: 1, name: 'Cancha 1', isIndoor: false, surface: 'césped sintético' },
        { number: 2, name: 'Cancha 2', isIndoor: false, surface: 'césped sintético' },
      ],
    },
  ];

  for (const clubData of clubsData) {
    const { courts, ...clubInfo } = clubData;

    const existingClub = await prisma.club.findFirst({
      where: { name: clubInfo.name, city: clubInfo.city },
    });

    if (!existingClub) {
      const club = await prisma.club.create({
        data: clubInfo,
      });

      for (const courtData of courts) {
        await prisma.court.create({
          data: {
            ...courtData,
            clubId: club.id,
          },
        });
      }

      console.log(`Club "${club.name}" created with ${courts.length} courts.`);
    } else {
      console.log(`Club "${clubInfo.name}" already exists, skipping.`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
