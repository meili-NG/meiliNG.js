import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

interface DeviceCode {
  user_code: string;
}

export async function deviceCodeCheckHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const userBase = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;
  const type = 'DEVICE_CODE';

  // get parameters and query
  let query = req.query as DeviceCode;
  const body = req.body as DeviceCode;

  // validate
  if (!Utils.isValidValue(query, query.user_code)) {
    if (!Utils.isValidValue(body, body.user_code)) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing user_code.');
      return;
    }

    query = body;
  }

  // get userData of selected user
  const userData = await Meiling.Identity.User.getDetailedInfo(userBase);
  if (!userData) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'unable to fetch user from DB.');
    return;
  }

  const minimumIssuedAt = new Date(new Date().getTime() - 1000 * Meiling.Authorization.Token.getValidTimeByType(type));

  const deviceTokens = await getPrismaClient().oAuthToken.findMany({
    where: {
      issuedAt: {
        gte: minimumIssuedAt,
      },
      type,
    },
  });

  const matchingUserCodes = deviceTokens.filter(
    (n) =>
      (n.metadata as unknown as Meiling.Authorization.Token.TokenMetadataV1).data?.deviceCode?.userCode ===
      query.user_code,
  );
  if (matchingUserCodes.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'no matching user_code found');
    return;
  }

  const userCode = matchingUserCodes[0];

  const client = await Meiling.OAuth2.ClientAuthorization.getClient(userCode.authorizationId);
  if (!client) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND, 'unable to find proper client');
    return;
  }

  const authorization = await Meiling.OAuth2.ClientAuthorization.getById(userCode.authorizationId);
  if (!authorization) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNAUTHORIZED,
      "specified oAuth2 application doesn't have proper authorization",
    );
    return;
  }

  // permissions that were requested
  const requestedPermissions = await Meiling.OAuth2.ClientAuthorization.getAuthorizedPermissions(authorization);

  rep.send({
    client_id: client.id,
    scope: requestedPermissions.map((n) => n.name).join(' '),
  });
}
