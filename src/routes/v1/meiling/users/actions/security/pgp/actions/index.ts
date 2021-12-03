import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userPGPActionDeleteKey from './delete';
import userPGPActionGetKey from './get';
import userPGPActionPutKey from './put';

function userPGPActionsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.delete('/', userPGPActionDeleteKey);
  app.put('/', userPGPActionPutKey);
  app.get('/', userPGPActionGetKey);

  done();
}

export default userPGPActionsPlugin;
