import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

async function permissionsGetHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
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

  rep.send(permissions);
}

export default permissionsGetHandler;
