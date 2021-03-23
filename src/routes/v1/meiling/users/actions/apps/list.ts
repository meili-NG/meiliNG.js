import { FastifyReply, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '..';
import { Client, User } from '../../../../../../common';

async function meilingV1UserAppListHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;
  const userData = await User.getDetailedInfo(user);

  const createdApps = await Promise.all(
    userData?.createdApps ? userData.createdApps.map((n) => Client.getInfoForOwners(n)) : [],
  );

  const authorizedApps = await Promise.all(
    userData?.authorizedApps ? userData.authorizedApps.map((n) => Client.sanitize(n)) : [],
  );

  rep.send({
    createdApps,
    authorizedApps,
  });
}

export default meilingV1UserAppListHandler;
