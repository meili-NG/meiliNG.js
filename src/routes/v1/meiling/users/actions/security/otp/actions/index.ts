import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userOTPActionDeleteKey from './delete';
import userOTPActionGetKey from './get';
import userOTPActionPutKey from './put';

function userOTPActionsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.delete('/', userOTPActionDeleteKey);
  app.put('/', userOTPActionPutKey);
  app.get('/', userOTPActionGetKey);

  done();
}

export default userOTPActionsPlugin;
