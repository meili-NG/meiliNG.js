import { FastifyInstance } from 'fastify';
import { registerV1MeilingEndpoints } from './meiling';
import { registerV1OAuth2Endpoints } from './oauth2';

export function registerV1Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, res) => {
    res.send({
      yo: 'sans',
    });
  });

  registerV1MeilingEndpoints(app, baseURI + '/meiling');
  registerV1OAuth2Endpoints(app, baseURI + '/oauth2');
}
