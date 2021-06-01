import { PrismaClient } from '.prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '.';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';
import { MeilingV1AppParams } from './interface';

const prisma = new PrismaClient();

async function appDeleteHandler(req_: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = req_ as MeilingV1ClientRequest;

  if (!req.status.owned) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, "you don't have permission to do this.");
    return;
  }

  const client = req.client;

  await prisma.oAuthToken.deleteMany({
    where: {
      authorization: {
        client: {
          id: client.id,
        },
      },
    },
  });

  await prisma.oAuthClientAuthorization.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await prisma.oAuthClientRedirectUris.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await prisma.oAuthClientSecrets.deleteMany({
    where: {
      client: {
        id: client.id,
      },
    },
  });

  await prisma.oAuthClient.delete({
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
