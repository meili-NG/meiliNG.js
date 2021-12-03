import { prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ErrorType } from '../../../../../interfaces';

async function clientSecretDeleteHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const body = _req.body as any;

  const secretId = (req.params as any)?.secretId;
  const clientId = req.client.id;

  const res =
    (await getPrismaClient().oAuthClientSecrets.count({
      where: {
        client: {
          id: clientId,
        },
        id: secretId,
      },
    })) === 1;

  if (!res) {
    return sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND, 'secret not found');
  }

  await getPrismaClient().oAuthClientSecrets.delete({
    where: {
      id: secretId,
    },
  });

  rep.send({ success: true });
}

export default clientSecretDeleteHandler;
