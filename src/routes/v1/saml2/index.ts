import { FastifyInstance, FastifyPluginOptions } from 'fastify';

function saml2V1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  // implement saml2 stub-endpoints
  app.addHook('onRequest', (req, rep, next) => {
    rep.status(501).send('Not Implemented');
  });

  done();
}

export default saml2V1Plugin;
