import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { v1MeilingPlugin } from './meiling';
import { meilingV1OAuth2 } from './oauth2';

function v1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
    });
  });

  app.register(
    (app, options, next) => {
      // register cors for meiling

      app.register(v1MeilingPlugin);
      next();
    },
    { prefix: '/meiling' },
  );

  app.register(
    (app, options, next) => {
      // register cors for oauth endpoints
      app.register(meilingV1OAuth2);
      next();
    },
    { prefix: '/oauth2' },
  );

  done();
}

export default v1Plugin;
