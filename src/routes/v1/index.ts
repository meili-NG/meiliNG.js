import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1Plugin } from './meiling';
import { v1OAuth2Plugin } from './oauth2';

function v1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
    });
  });

  app.register(meilingV1Plugin, { prefix: '/meiling' });

  app.register(v1OAuth2Plugin, { prefix: '/oauth2' });

  done();
}

export default v1Plugin;
