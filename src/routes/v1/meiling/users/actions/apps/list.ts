import { FastifyReply, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '..';
import { prisma } from '../../../../../..';
import { Client, User } from '../../../../../../common';

async function meilingV1UserAppListHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;
  const userData = await User.getDetailedInfo(user);

  const createdApps = await Promise.all(
    userData?.createdApps ? userData.createdApps.map((n) => Client.getInfoForOwners(n)) : [],
  );

  const authorizedApps = await Promise.all(
    userData?.authorizedApps
      ? userData.authorizedApps.map(async (n) => {
          const firstAuthorization = await prisma.oAuthClientAuthorization.findFirst({
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

          const lastAuthorization = await prisma.oAuthClientAuthorization.findFirst({
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

export default meilingV1UserAppListHandler;
