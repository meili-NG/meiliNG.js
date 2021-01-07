import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fs, { promises as fsNext } from 'fs';
import { PrismaClient } from '@prisma/client';
import { registerRootEndpoints } from './routes';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
const env = process.env.NODE_ENV || 'development';

export const prisma = new PrismaClient();
export const VERSION = packageJson.version;

export const isDevelopment = env === 'development';

const app = fastify({
  logger: true,
});

registerRootEndpoints(app, '/');

app.listen(8080);
