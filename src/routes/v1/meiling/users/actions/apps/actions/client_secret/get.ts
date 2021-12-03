import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

async function clientSecretGetHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const clientId = req.client.id;

  const clientSecret = await getPrismaClient().oAuthClientSecrets.findMany({
    where: {
      clientId,
    },
  });

  const response = clientSecret.map((n) => ({
    secret: n.secret,
    id: n.id,
    issuedAt: n.issuedAt,
  }));

  rep.send(response);
}

export default clientSecretGetHandler;
