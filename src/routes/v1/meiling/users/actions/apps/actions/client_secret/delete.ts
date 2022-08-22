import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

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
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'secret not found');
  }

  await getPrismaClient().oAuthClientSecrets.delete({
    where: {
      id: secretId,
    },
  });

  rep.send({ success: true });
}

export default clientSecretDeleteHandler;
