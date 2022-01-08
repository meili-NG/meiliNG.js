import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '..';
import { Meiling } from '../../../../../../common';
import { getPrismaClient } from '../../../../../../resources/prisma';

async function userAppsHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;
  const userData = await Meiling.Identity.User.getDetailedInfo(user);

  const ownedApps = await Promise.all(
    userData?.ownedApps ? userData.ownedApps.map((n) => Meiling.OAuth2.Client.getInfoForOwners(n)) : [],
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
            ...(await Meiling.OAuth2.Client.sanitize(n)),
            authorizedAt: firstAuthorization?.authorizedAt,
            lastAuthAt: lastAuthorization?.authorizedAt,
          };
        })
      : [],
  );

  rep.send({
    ownedApps,
    authorizedApps,
  });
}

export default userAppsHandler;
