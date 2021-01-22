import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fs from 'fs';
import { Config } from './interface';
import { registerRootEndpoints } from './routes';
import { MeilingV1Session } from './routes/v1/meiling/common';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as Config;

const env = process.env.NODE_ENV || 'development';

export const prisma = new PrismaClient();
export const VERSION = packageJson.version;

export const isDevelopment = env === 'development';

MeilingV1Session.loadSession();

const app = fastify({
  logger: {
    prettyPrint: true,
  },
  trustProxy: config.behindProxy,
});

app.register(fastifyCors, {
  origin: isDevelopment
    ? (origin, callback) => {
        callback(null, true);
      }
    : config.allowLogin,
});

(async () => {
  try {
    await prisma.$connect();
    await prisma.$executeRaw('SHOW TABLES');
  } catch (e) {
    console.error('[Database] Failed to connect! Please check MySQL/MariaDB is online.');
    process.exit(1);
  }

  registerRootEndpoints(app, '/');
  app.listen(config.listeningPort);
})();
