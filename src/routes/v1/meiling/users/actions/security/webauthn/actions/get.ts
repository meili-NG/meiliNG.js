import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../common/database';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ExtendedAuthMethods, MeilingV1ErrorType } from '../../../../../interfaces';

const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.SECURITY_KEY);

async function userWebAuthnActionGetKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
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

  const keyData = await getPrismaClient().authorization.findFirst({
    where: {
      user: {
        id: user.id,
      },
      method: dbType,
      id: tokenId,
    },
  });

  if (!keyData) {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
    return;
  }

  rep.send({
    id: keyData.id,
    createdAt: keyData.createdAt,
    name: (keyData.data as any).data.name,

    allowSingleFactor: keyData.allowSingleFactor,
    allowTwoFactor: keyData.allowTwoFactor,
    allowPasswordReset: keyData.allowPasswordReset,
  });
}

export default userWebAuthnActionGetKey;