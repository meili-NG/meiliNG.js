import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import clientSecretDeleteHandler from './delete';
import clientSecretGetHandler from './get';
import clientSecretPostHandler from './post';

export function appClientSecretPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', clientSecretGetHandler);
  app.post('/', clientSecretPostHandler);
  app.delete('/:secretId', clientSecretDeleteHandler);

  done();
}
