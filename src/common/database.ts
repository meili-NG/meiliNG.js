import { PrismaClient } from '.prisma/client';

const prisma = new PrismaClient();

export async function testDatabase(): Promise<boolean> {
  try {
    console.log('[Startup] Checking Database Connection...');
    await prisma.$connect();
    await prisma.$executeRaw('SHOW TABLES');
    return true;
  } catch (e) {
    return false;
  }
}
