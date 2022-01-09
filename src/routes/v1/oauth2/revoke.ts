import { FastifyReply, FastifyRequest } from 'fastify';
import { getPrismaClient } from '../../../resources/prisma';
import { Meiling } from '../../../common';

interface OAuth2QueryRevokeParameters {
  token: string;
}

export async function oAuth2RevokeTokenHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const query = req.query as OAuth2QueryRevokeParameters;

  if (!query?.token) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST, 'token field is missing');
    return;
  }

  const delTarget = await getPrismaClient().oAuthToken.findUnique({
    where: {
      token: query?.token,
    },
  });

  if (delTarget === null) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'token does not exist, check if it is valid token',
    );
    return;
  }

  await getPrismaClient().oAuthToken.delete({
    where: {
      token: query?.token,
    },
  });

  rep.send();
}
