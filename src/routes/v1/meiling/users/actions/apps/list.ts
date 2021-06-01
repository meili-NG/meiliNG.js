import { PrismaClient } from '.prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '..';
import { Client, User } from '../../../../../../common';
import { getPrismaClient } from '../../../../../../resources/prisma';

async function userAppsHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as User.UserInfoObject;
  const userData = await User.getDetailedInfo(user);

  const createdApps = await Promise.all(
    userData?.createdApps ? userData.createdApps.map((n) => Client.getInfoForOwners(n)) : [],
  );

  const authorizedApps = await Promise.all(
    userData?.authorizedApps
      ? userData.authorizedApps.map(async (n) => {
          const firstAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
            where: {
              client: {
                id: n.id,
              },
              user: {
                id: user.id,
              },
            },
            orderBy: {
              authorizedAt: 'asc',
            },
          });

          const lastAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
            where: {
              client: {
                id: n.id,
              },
              user: {
                id: user.id,
              },
            },
            orderBy: {
              authorizedAt: 'desc',
            },
          });

          return {
            ...(await Client.sanitize(n)),
            authorizedAt: firstAuthorization?.authorizedAt,
            lastAuthAt: lastAuthorization?.authorizedAt,
          };
        })
      : [],
  );

  rep.send({
    createdApps,
    authorizedApps,
  });
}

export default userAppsHandler;
