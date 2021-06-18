import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import adminV1Plugin from './admin';
import meilingV1Plugin from './meiling';
import oAuth2V1Plugin from './oauth2';

function v1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
    });
  });

  app.register(adminV1Plugin, { prefix: '/admin' });
  app.register(meilingV1Plugin, { prefix: '/meiling' });
  app.register(oAuth2V1Plugin, { prefix: '/oauth2' });

  done();
}

export default v1Plugin;
