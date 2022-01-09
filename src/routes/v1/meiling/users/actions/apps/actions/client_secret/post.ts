import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

async function clientSecretPostHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const body = _req.body as any;
  const user = await getUserFromActionRequest(req);

  const secret = Meiling.Authorization.Token.generateToken(64);

  if (!user) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const result = await getPrismaClient().oAuthClientSecrets.create({
    data: {
      client: {
        connect: {
          id: req.client.id,
        },
      },
      secret,
      issuer: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  rep.send({
    id: result.id,
    secret,
  });
}

export default clientSecretPostHandler;
