import { FastifyInstance } from 'fastify';
import fastifyCors from 'fastify-cors';
import { config, isDevelopment } from '../..';
import { registerV1MeilingEndpoints } from './meiling';
import { registerV1OAuth2Endpoints } from './oauth2';

export function registerV1Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
    });
  });

  app.register(
    (app, options, next) => {
      // register cors for meiling
      app.register(fastifyCors, {
        origin: isDevelopment ? '*' : config.frontend.url,
      });

      registerV1MeilingEndpoints(app);
      next();
    },
    { prefix: baseURI + '/meiling' },
  );

  app.register(
    (app, options, next) => {
      // register cors for oauth endpoints
      app.register(fastifyCors, {
        origin: '*',
      });

      registerV1OAuth2Endpoints(app);
      next();
    },
    { prefix: baseURI + '/oauth2' },
  );
}
