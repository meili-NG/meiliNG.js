import { PrismaClient } from '.prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Client, ClientAccessControls, ClientAuthorization, Token, User, Utils } from '../../../../../../../common';
import { TokenMetadata } from '../../../../../../../common/token';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

const prisma = new PrismaClient();

interface DeviceCode {
  user_code: string;
}

export async function deviceCodeAuthorizeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const userBase = (await getUserFromActionRequest(req)) as User.UserInfoObject;
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
  const userData = await User.getDetailedInfo(userBase);
  if (!userData) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'unable to fetch user from DB.');
    return;
  }

  const minimumIssuedAt = new Date(new Date().getTime() - 1000 * Token.getValidTimeByType(type));

  const deviceTokens = await prisma.oAuthToken.findMany({
    where: {
      issuedAt: {
        gte: minimumIssuedAt,
      },
      type,
    },
  });

  const matchingUserCodes = deviceTokens.filter(
    (n) => ((n.metadata as unknown) as Token.TokenMetadataV1).data?.deviceCode?.userCode === query.user_code,
  );
  if (matchingUserCodes.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'no matching user_code found');
    return;
  }

  const userCode = matchingUserCodes[0];

  const client = await ClientAuthorization.getClient(userCode.authorizationId);
  if (!client) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND, 'unable to find proper client');
    return;
  }

  // load access control
  const acl = await Client.getAccessControl(client.id);
  if (!acl) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'Failed to get Access Control from Server.');
    return;
  }

  // is this user able to pass client check
  const clientPrivateCheck = await ClientAccessControls.checkUsers(acl, userBase);
  if (!clientPrivateCheck) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'specified oAuth2 application is inaccessible');
    return;
  }

  const authorization = await ClientAuthorization.getById(userCode.authorizationId);
  if (!authorization) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNAUTHORIZED,
      "specified oAuth2 application doesn't have proper authorization",
    );
    return;
  }

  await prisma.oAuthClientAuthorization.update({
    where: {
      id: authorization.id,
    },
    data: {
      user: {
        connect: {
          id: userBase.id,
        },
      },
    },
  });

  const metadata = (userCode.metadata as unknown) as TokenMetadata;
  if (!metadata?.data?.deviceCode) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, "token doesn't seems to be have proper metadata");
    return;
  }

  metadata.data.deviceCode.isAuthorized = true;

  await prisma.oAuthToken.update({
    where: {
      token: userCode.token,
    },
    data: {
      metadata: metadata as any,
    },
  });

  rep.send({
    success: true,
  });
}
