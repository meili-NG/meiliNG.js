import { getPrismaClient } from '../../resources/prisma';
import Log from '../terminal/log';

export async function testDatabase(): Promise<boolean> {
  try {
    Log.info('Testing database connection...');
    await getPrismaClient().$queryRaw`SHOW TABLES`;
    Log.ok('Database connection test success');
    return true;
  } catch (e) {
    Log.error('Database connection test failed...', e);
    return false;
  }
}
