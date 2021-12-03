import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

async function permissionsGetAvailableHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const permissions = (
    await getPrismaClient().permission.findMany({
      where: {
        accessControls: {
          some: {
            id: req.client.aclId,
          },
        },
      },
    })
  ).map((n) => n.name) as string[];

  const response = (
    (
      await getPrismaClient().permission.findMany({
        where: {
          isAvailable: true,
        },
      })
    ).map((n) => n.name) as string[]
  ).filter((n) => !permissions.includes(n));

  rep.send(response);
}

export default permissionsGetAvailableHandler;
