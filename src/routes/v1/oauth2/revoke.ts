import { FastifyReply, FastifyRequest } from 'fastify';
import { sendOAuth2Error } from './error';
import { OAuth2ErrorResponseType } from './interfaces';
import { getPrismaClient } from '../../../resources/prisma';

interface OAuth2QueryRevokeParameters {
  token: string;
}

export async function oAuth2RevokeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const query = req.query as OAuth2QueryRevokeParameters;

  if (!query?.token) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'token field is missing');
    return;
  }

  const del = await getPrismaClient().oAuthToken.delete({
    where: {
      token: query?.token,
    },
  });

  if (del !== null) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'token does not exist');
    return;
  }

  rep.send();
}
