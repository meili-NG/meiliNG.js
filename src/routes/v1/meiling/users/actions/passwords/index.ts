import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { userPasswordDeleteHandler } from './delete';
import { userPasswordGetHandler } from './get';
import { userPasswordCreateHandler } from './post';
import { userPasswordUpdateHandler } from './put';

export interface PasswordBody {
  password: string;
}

export interface PasswordChangeBody {
  password: string;
  newPassword: string;
}

function userPasswordPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', userPasswordGetHandler);
  app.post('/', userPasswordCreateHandler);
  app.put('/', userPasswordUpdateHandler);
  app.delete('/', userPasswordDeleteHandler);

  done();
}

export default userPasswordPlugin;
