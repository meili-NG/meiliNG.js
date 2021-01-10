import { FastifyInstance } from 'fastify';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignupHandler } from './signup';
import { meilingV1UserInfoHandler } from './user';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'Meiling Endpoints',
    });
  });

  app.get(baseURI + '/user', meilingV1UserInfoHandler);

  app.get(baseURI + '/signin', meilingV1SigninHandler);
  app.get(baseURI + '/signup', meilingV1SignupHandler);
}
