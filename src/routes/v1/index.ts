import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { v1MeilingPlugin } from './meiling';
import { meilingV1OAuth2 } from './oauth2';

function v1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
    });
  });

  app.register(v1MeilingPlugin, { prefix: '/meiling' });

  app.register(meilingV1OAuth2, { prefix: '/oauth2' });

  done();
}

export default v1Plugin;
