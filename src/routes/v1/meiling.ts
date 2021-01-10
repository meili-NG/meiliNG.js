import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/user', meilingV1UserHandler);
}

export function meilingV1UserHandler(req: FastifyRequest, rep: FastifyReply) {
  const authorization = req.headers.authorization;
}
