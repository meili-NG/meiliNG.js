import { FastifyReply, FastifyRequest } from 'fastify';
import { getPrismaClient } from '../../../resources/prisma';
import { sendOAuth2Error } from './error';
import { OAuth2ErrorResponseType } from './interfaces';

interface OAuth2QueryRevokeParameters {
  token: string;
}

export async function oAuth2RevokeTokenHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const query = req.query as OAuth2QueryRevokeParameters;

  if (!query?.token) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'token field is missing');
    return;
  }

  const delTarget = await getPrismaClient().oAuthToken.findUnique({
    where: {
      token: query?.token,
    },
  });

  if (delTarget === null) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'token does not exist, check if it is valid token');
    return;
  }

  await getPrismaClient().oAuthToken.delete({
    where: {
      token: query?.token,
    },
  });

  rep.send();
}
