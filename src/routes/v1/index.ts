import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { registerV1OAuth2Endpoints } from './oauth2';

export function registerV1Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, res) => {
    res.send({
      yo: 'sans',
    });
  });

  registerV1OAuth2Endpoints(app, baseURI + '/oauth2');
}
