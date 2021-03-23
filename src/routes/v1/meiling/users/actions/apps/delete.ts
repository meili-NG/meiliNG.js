import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '.';
import { prisma } from '../../../../../..';
import { Client } from '../../../../../../common';
import { MeilingV1Session } from '../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';
import { MeilingV1AppParams } from './interface';

async function meilingV1UserAppDeleteHandler(req_: FastifyRequest, rep: FastifyReply): Promise<void> {
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

export default meilingV1UserAppDeleteHandler;
