import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1SignupHandler } from './signup';

export function v1MeilingSignupPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.post('/signup', meilingV1SignupHandler);

  done();
}
