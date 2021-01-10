import { FastifyInstance } from 'fastify';
import { meilingV1LoginHandler } from './login';
import { meilingV1UserHandler } from './user';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'Meiling Endpoints',
    });
  });

  app.get(baseURI + '/user', meilingV1UserHandler);
  app.get(baseURI + '/login', meilingV1LoginHandler);
}
