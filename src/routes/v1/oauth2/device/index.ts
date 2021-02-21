import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1OAuth2DeviceCodeHandler } from './code';

export function meilingV1OAuthDevice(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.post('/code', meilingV1OAuth2DeviceCodeHandler);

  done();
}
