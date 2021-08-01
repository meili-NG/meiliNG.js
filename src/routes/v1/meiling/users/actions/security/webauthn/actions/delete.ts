import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { User, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../common/database';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ExtendedAuthMethods, MeilingV1ErrorType } from '../../../../../interfaces';

const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.SECURITY_KEY);

async function userWebAuthnActionDeleteKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  const tokenId = (req.params as any).tokenId;
  if (!Utils.isNotBlank(tokenId)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }

  const checkExist =
    (await getPrismaClient().authorization.count({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
        id: tokenId,
      },
    })) > 0;

  if (!checkExist) {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
    return;
  }

  await getPrismaClient().authorization.delete({
    where: {
      id: tokenId,
    },
  });

  await User.prevent2FALockout(user.id);

  rep.send({ success: true });
}

export default userWebAuthnActionDeleteKey;
