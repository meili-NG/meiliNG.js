import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import fastify from 'fastify';
import fastifyFormbody from 'fastify-formbody';
import fs from 'fs';
import { Banner, Database } from './common';
import config from './config';
import meilingPlugin from './routes';
import { MeilingV1Session } from './routes/v1/meiling/common';

export const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

const env = process.env.NODE_ENV || 'development';

export const prisma = new PrismaClient();
export const isDevelopment = env === 'development';

// some banner stuff
Banner.showBanner();
Banner.devModeCheck();

console.log('[Startup] Loading Session Files...');
MeilingV1Session.loadSessionSaveFiles();

console.log('[Startup] Starting up Fastify...');
const app = fastify({
  logger: {
    prettyPrint: true,
  },
  trustProxy: config.fastify.proxy
    ? config.fastify.proxy.allowedHosts
      ? config.fastify.proxy.allowedHosts
      : true
    : false,
});

console.log('[Startup] Registering for Fastify Handler');
app.register(fastifyFormbody);

(async () => {
  if (!(await Database.testDatabase())) {
    console.error(
      chalk.bgRedBright(
        chalk.whiteBright(chalk.bold('[Database] Failed to connect! Please check MySQL/MariaDB is online.')),
      ),
    );
    console.log();
    process.exit(1);
  }

  console.log('[Startup] Registering Root Endpoints...');
  app.register(meilingPlugin);

  if (typeof config.fastify.listen === 'string') {
    if (fs.existsSync(config.fastify.listen)) {
      fs.unlinkSync(config.fastify.listen);
    }
  }

  console.log('[Startup] Starting up fastify...');
  await app.listen(config.fastify.listen);

  if (typeof config.fastify.listen === 'string') {
    if (config.fastify.unixSocket?.chown?.uid !== undefined && config.fastify.unixSocket?.chown?.gid !== undefined) {
      console.log('[Startup] Setting up Owner Permissions of Socket...');
      fs.chownSync(
        config.fastify.listen,
        config.fastify.unixSocket?.chown?.uid as number,
        config.fastify.unixSocket?.chown?.gid as number,
      );
    }
    if (config.fastify.unixSocket?.chmod) {
      console.log('[Startup] Setting up Access Permissions of Socket...');
      fs.chmodSync(config.fastify.listen, config.fastify.unixSocket.chmod);
    }
  }
})();
