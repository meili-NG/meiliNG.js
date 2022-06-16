import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { AttestationResult, Factor, Fido2Lib } from 'fido2-lib';
import config from '../../../../../../../../resources/config';
import { getSessionFromRequest } from '../../../../../../../../common/meiling/v1/session';
import crypto from 'crypto';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.WEBAUTHN);

async function userWebAuthnActionPostKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const session = await getSessionFromRequest(req);

  const body = req.body as
    | {
        hostname: string;
        challengeResponse?: AttestationResult;
        name?: string;
      }
    | undefined;

  let hostname = body?.hostname;
  if (!hostname || !Utils.isNotBlank(hostname)) {
    hostname = config.frontend.url[0];
  }

  if (!config.frontend.url.includes(hostname)) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'provided hostname is not supported',
    );
  }

  const challengeResponse = body?.challengeResponse;

  const registering = challengeResponse !== undefined;
  const f2l = new Fido2Lib({});

  if (registering && body) {
    const webAuthnObject = session?.registering?.webAuthn;

    if (!webAuthnObject || !Utils.isNotBlank(webAuthnObject.challenge, webAuthnObject.hostname, webAuthnObject.origin))
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED);

    if (!Utils.isNotBlank(body.name))
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);

    const attensationExpectations = {
      challenge: webAuthnObject.challenge,
      origin: webAuthnObject.origin,
      factor: 'either' as Factor,
    };

    try {
      const result = await f2l.attestationResult(challengeResponse, attensationExpectations);
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED);
    } catch (e) {
      // TODO: further debugging required.
      throw e;
    }
  } else {
    const challenge = Meiling.Authentication.Token.generateToken(128);
    const origin = req.headers.origin ?? hostname;

    await Meiling.V1.Session.setSession(req, {
      ...session,
      registering: {
        ...session?.registering,
        webAuthn: {
          origin,
          hostname,
          challenge,
        },
      },
    });

    rep.send({
      challenge,
    });
  }
}

export default userWebAuthnActionPostKey;
