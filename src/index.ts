import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyFormbody from 'fastify-formbody';
import Figlet from 'figlet';
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

console.log(Figlet.textSync('Meiling'));
console.log();
console.log(`Meiling Engine, version. ${packageJson.version}`);
console.log(chalk.blueBright('https://github.com/Stella-IT/meiling'));
console.log();
console.log('Copyright © Stella IT Inc. and Meiling Engine Contributors');
if (isDevelopment) {
  console.log();
  console.log(
    chalk.yellowBright('Launching in Development mode, ') +
      chalk.redBright(chalk.bold('DO NOT USE THIS IN PRODUCTION.')),
  );
  console.log();
}

console.log('[Startup] Loading Session Files...');
MeilingV1Session.loadSessionSaveFiles();

console.log('[Startup] Starting up Fastify...');
const app = fastify({
  logger: {
    prettyPrint: true,
  },
  trustProxy: config.behindProxy,
});

console.log('[Startup] Registering for CORS header handler');
app.register(fastifyCors, {
  origin: isDevelopment
    ? (origin, callback) => {
        callback(null, true);
      }
    : config.allowLogin,
});

console.log('[Startup] Registering for Fastify Handler');
app.register(fastifyFormbody);

(async () => {
  try {
    console.log('[Startup] Checking Database Connection...');
    await prisma.$connect();
    await prisma.$executeRaw('SHOW TABLES');
  } catch (e) {
    console.error(chalk.red('[Database] Failed to connect! Please check MySQL/MariaDB is online.'));
    process.exit(1);
  }

  console.log('[Startup] Registering Root Endpoints...');
  registerRootEndpoints(app, '/');

  console.log('[Startup] Starting up fastify...');
  app.listen(config.listeningPort);
})();
