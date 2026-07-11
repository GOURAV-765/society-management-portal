import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const email = 'gou4371@gmail.com';
  const password = 'Gou@302005';
  console.log(`Setting password for ${email} in local database...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash },
    });
    console.log(`Updated password for ${email} in local database!`);
  } else {
    console.error(`User ${email} not found.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
