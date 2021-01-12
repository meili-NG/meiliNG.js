import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fs, { promises as fsNext } from 'fs';
import { PrismaClient } from '@prisma/client';
import { registerRootEndpoints } from './routes';
import { Config } from './interface';
import FastifySession from 'fastify-secure-session';
import ChildProcess from 'child_process';
import fastifyCors from 'fastify-cors';
import { loadMeilingV1SessionTokens } from './routes/v1/meiling/common';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as Config;

const env = process.env.NODE_ENV || 'development';

export const prisma = new PrismaClient();
export const VERSION = packageJson.version;

export const isDevelopment = env === 'development';

if (!fs.existsSync(config.session.sessionKeyPath)) {
  console.log(`Session Secret Cookie Key was not found at ${config.session.sessionKeyPath}. Generating one.`);
  const output = ChildProcess.execSync('./node_modules/.bin/secure-session-gen-key');
  fs.writeFileSync(config.session.sessionKeyPath, output);
  console.log(`Generated key file ${config.session.sessionKeyPath}. Continue.`);
  console.log();
}

loadMeilingV1SessionTokens();

const app = fastify({
  logger: true,
});

/*
app.register(FastifySession, {
  cookieName: 'meiling-engine-session',
  key: fs.readFileSync(config.session.sessionKeyPath),
  cookie: {
    path: '/',
    maxAge: config.session.maxAge,
  },
});
*/

app.register(fastifyCors, {
  /*
  origin: isDevelopment ? (origin, callback) => {
    callback(null, true);
  } : config.allowLogin,
  */
  origin: ['http://localhost:3000'],
});

registerRootEndpoints(app, '/');

app.listen(8080);
