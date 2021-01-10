import { FastifyInstance } from 'fastify';
import { meilingV1LoginHandler } from './login';
import { meilingV1UserHandler } from './user';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/user', meilingV1UserHandler);
  app.get(baseURI + '/login', meilingV1LoginHandler);
}
