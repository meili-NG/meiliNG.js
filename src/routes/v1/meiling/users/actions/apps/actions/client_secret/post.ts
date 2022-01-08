import { prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { generateToken } from '../../../../../../../../common/meiling/authorization/token';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ErrorType } from '../../../../../interfaces';

async function clientSecretPostHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const body = _req.body as any;
  const user = await getUserFromActionRequest(req);

  const secret = generateToken(64);

  if (!user) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
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
