import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import user2FAPlugin from './2fa';
import userPasswordsPlugin from './passwords';
import userPGPPlugin from './pgp';
import userWebAuthnPlugin from './webauthn';

function userSecurityPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.register(userPasswordsPlugin, { prefix: '/passwords' });
  app.register(user2FAPlugin, { prefix: '/2fa' });
  app.register(userWebAuthnPlugin, { prefix: '/webauthn' });
  app.register(userPGPPlugin, { prefix: '/pgp' });

  done();
}

export default userSecurityPlugin;
