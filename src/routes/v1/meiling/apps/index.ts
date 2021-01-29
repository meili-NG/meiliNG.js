import { FastifyInstance } from 'fastify';
import { meilingV1AppHandler } from './get';
import { meilingV1AppPostHandler } from './post';

export function registerV1MeilingAppsEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, meilingV1AppHandler);
  app.get(baseURI + '/:clientId', meilingV1AppHandler);
  app.post(baseURI, meilingV1AppPostHandler);
}
