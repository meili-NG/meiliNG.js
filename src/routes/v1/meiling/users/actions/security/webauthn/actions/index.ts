import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userWebAuthnActionDeleteKey from './delete';
import userWebAuthnActionGetKey from './get';
import userWebAuthnActionPutKey from './put';

function userWebAuthnActionsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.delete('/', userWebAuthnActionDeleteKey);
  app.put('/', userWebAuthnActionPutKey);
  app.get('/', userWebAuthnActionGetKey);

  done();
}

export default userWebAuthnActionsPlugin;
