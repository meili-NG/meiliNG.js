import { PrismaClient } from '.prisma/client';
import { getPrismaClient } from '../resources/prisma';

export async function testDatabase(): Promise<boolean> {
  try {
    console.log('[Startup] Checking Database Connection...');
    await getPrismaClient().$connect();
    await getPrismaClient().$executeRaw('SHOW TABLES');
    return true;
  } catch (e) {
    return false;
  }
}
