import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records (in reverse order of dependencies)
  console.log('Cleaning old records...');
  await prisma.member.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.society.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123', 10);

  // 2. Create Society A: Greenwood Society
  console.log('Creating societies...');
  const greenwood = await prisma.society.create({
    data: {
      name: 'Greenwood Society',
      description: 'A lush green residential township with state of the art amenities.',
    },
  });

  // Create Society B: Skyline Residency
  const skyline = await prisma.society.create({
    data: {
      name: 'Skyline Residency',
      description: 'Modern high-rise residential apartment complex in the heart of the city.',
    },
  });

  const societies = [greenwood, skyline];

  for (const society of societies) {
    console.log(`Setting up Roles, Permissions, and Users for: ${society.name}`);

    // 3. Create Permissions
    const pRead = await prisma.permission.create({
      data: { name: 'member:read', description: 'Read member list and profile details', societyId: society.id },
    });
    const pCreate = await prisma.permission.create({
      data: { name: 'member:create', description: 'Create/add new members', societyId: society.id },
    });
    const pUpdate = await prisma.permission.create({
      data: { name: 'member:update', description: 'Update existing members', societyId: society.id },
    });
    const pDelete = await prisma.permission.create({
      data: { name: 'member:delete', description: 'Soft-delete members', societyId: society.id },
    });

    // 4. Create Roles
    const rAdmin = await prisma.role.create({
      data: { name: 'Core Admin', description: 'Administrator with full management privileges', societyId: society.id },
    });
    const rLead = await prisma.role.create({
      data: { name: 'Core Team Lead', description: 'Team leader with write privileges, except delete', societyId: society.id },
    });
    const rMember = await prisma.role.create({
      data: { name: 'General Member', description: 'Standard member with read-only access', societyId: society.id },
    });

    // 5. Create Role Permissions (Assign permissions)
    // Admin gets all
    await prisma.rolePermission.createMany({
      data: [
        { roleId: rAdmin.id, permissionId: pRead.id, societyId: society.id },
        { roleId: rAdmin.id, permissionId: pCreate.id, societyId: society.id },
        { roleId: rAdmin.id, permissionId: pUpdate.id, societyId: society.id },
        { roleId: rAdmin.id, permissionId: pDelete.id, societyId: society.id },
      ],
    });

    // Lead gets read, create, update
    await prisma.rolePermission.createMany({
      data: [
        { roleId: rLead.id, permissionId: pRead.id, societyId: society.id },
        { roleId: rLead.id, permissionId: pCreate.id, societyId: society.id },
        { roleId: rLead.id, permissionId: pUpdate.id, societyId: society.id },
      ],
    });

    // Member gets read-only
    await prisma.rolePermission.createMany({
      data: [
        { roleId: rMember.id, permissionId: pRead.id, societyId: society.id },
      ],
    });

    // 6. Create Users & Members
    const domain = society.id === greenwood.id ? 'greenwood.com' : 'skyline.com';

    // Admin
    const uAdmin = await prisma.user.create({
      data: {
        email: `admin@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rAdmin.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uAdmin.id,
        societyId: society.id,
        firstName: 'Amit',
        lastName: society.id === greenwood.id ? 'Sharma' : 'Verma',
        phone: society.id === greenwood.id ? '9876543210' : '9876543211',
        bio: `${society.name} Core Administrator.`,
        status: 'ACTIVE',
      },
    });

    // Team Lead
    const uLead = await prisma.user.create({
      data: {
        email: `lead@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rLead.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uLead.id,
        societyId: society.id,
        firstName: 'Priya',
        lastName: society.id === greenwood.id ? 'Patel' : 'Rao',
        phone: society.id === greenwood.id ? '9876543220' : '9876543221',
        bio: `${society.name} Core Team Lead.`,
        status: 'ACTIVE',
      },
    });

    // General Member
    const uMember = await prisma.user.create({
      data: {
        email: `member@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rMember.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uMember.id,
        societyId: society.id,
        firstName: 'Rahul',
        lastName: society.id === greenwood.id ? 'Kumar' : 'Gupta',
        phone: society.id === greenwood.id ? '9876543230' : '9876543231',
        bio: `Resident General Member of ${society.name}.`,
        status: 'ACTIVE',
      },
    });

    // Create 12 more mock members for pagination testing (Greenwood only)
    if (society.id === greenwood.id) {
      console.log('Seeding additional mock members for pagination testing...');
      const firstNames = [
        'Aakash', 'Neha', 'Rohan', 'Anjali', 'Vikram',
        'Sneha', 'Siddharth', 'Divya', 'Karan', 'Aditi',
        'Vijay', 'Pooja'
      ];
      const lastNames = [
        'Singh', 'Joshi', 'Mehta', 'Nair', 'Chawla',
        'Kapoor', 'Reddy', 'Bose', 'Sen', 'Dutta',
        'Mishra', 'Trivedi'
      ];

      for (let i = 0; i < 12; i++) {
        const uTemp = await prisma.user.create({
          data: {
            email: `resident${i + 1}@greenwood.com`,
            passwordHash,
            status: i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
            roleId: rMember.id,
            societyId: greenwood.id,
          },
        });

        await prisma.member.create({
          data: {
            userId: uTemp.id,
            societyId: greenwood.id,
            firstName: firstNames[i],
            lastName: lastNames[i],
            phone: `90000000${i.toString().padStart(2, '0')}`,
            bio: `Resident member ${firstNames[i]} in Greenwood.`,
            status: i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
          },
        });
      }
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
