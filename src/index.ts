import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import fastify from 'fastify';
import fastifyFormbody from 'fastify-formbody';
import fs from 'fs';
import { Banner, Database } from './common';
import { Config } from './interface';
import { registerRootEndpoints } from './routes';
import { MeilingV1Session } from './routes/v1/meiling/common';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as Config;

const env = process.env.NODE_ENV || 'development';

export const prisma = new PrismaClient();
export const VERSION = packageJson.version;

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
  trustProxy: config.meiling.proxy
    ? config.meiling.proxy.allowedHosts
      ? config.meiling.proxy.allowedHosts
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
  registerRootEndpoints(app, '/');

  console.log('[Startup] Starting up fastify...');
  app.listen(config.listeningPort);
})();
