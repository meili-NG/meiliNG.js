import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '.';
import { Meiling } from '../../../../../../common';
import { getPrismaClient } from '../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../../../common/meiling/v1/error/error';

async function appDeleteHandler(req_: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = req_ as MeilingV1ClientRequest;

  if (!req.status.owned) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED, "you don't have permission to do this.");
    return;
  }

  const client = req.client;

  await getPrismaClient().oAuthToken.deleteMany({
    where: {
      authorization: {
        client: {
          id: client.id,
        },
      },
    },
  });

  await getPrismaClient().oAuthClientAuthorization.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await getPrismaClient().oAuthClientRedirectUris.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await getPrismaClient().oAuthClientSecrets.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await getPrismaClient().oAuthClient.delete({
    where: {
      id: client.id,
    },
  });

  rep.send({
    success: true,
  });
  return;
}

export default appDeleteHandler;
