import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import config from '../../../../../../../../resources/config';
import { getSessionFromRequest } from '../../../../../../../../common/meiling/v1/session';
import crypto from 'crypto';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { RegistrationCredentialJSON } from '@simplewebauthn/typescript-types';
import { AuthenticationMethod } from '@prisma/client';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.WEBAUTHN);

async function userWebAuthnActionPostKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const session = await getSessionFromRequest(req);

  interface RegisterRequest {
    hostname: string;
    name: string;
  }

  type RegisterProcess = RegisterRequest & RegistrationCredentialJSON;
  type RegisterBody = RegisterRequest | RegisterProcess;

  const body = req.body as RegisterBody | undefined;

  let hostname = body?.hostname;
  if (!hostname || !Utils.isNotBlank(hostname)) {
    hostname = new URL(config.frontend.url[0]).hostname;
  }

  try {
    if (hostname !== new URL('https://' + hostname).hostname) {
      throw new Error();
    }
  } catch (e) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid hostname');
  }

  const allowedHostnames = config.frontend.url.map((n) => new URL(n).hostname);
  console.log(allowedHostnames);

  if (!allowedHostnames.includes(hostname)) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'provided hostname is not supported',
    );
  }

  const challengeResponse = body as RegisterProcess;

  const registering = challengeResponse.response !== undefined;

  if (registering && body) {
    const webAuthnObject = session?.registering?.webAuthn;

    if (!webAuthnObject || !Utils.isNotBlank(webAuthnObject.challenge, webAuthnObject.hostname, webAuthnObject.origin))
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED);

    if (!Utils.isNotBlank(body.name))
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'missing webauthn token name',
      );

    if (!Utils.isNotBlank(challengeResponse.id))
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'malformed challengeResponse',
      );

    try {
      if (!challengeResponse.rawId)
        challengeResponse.rawId = Buffer.from(challengeResponse.id as string, 'base64url').toString('base64url');

      const result = await verifyRegistrationResponse({
        credential: challengeResponse,
        expectedChallenge: Buffer.from(webAuthnObject.challenge).toString('base64url'),
        expectedOrigin: webAuthnObject.origin,
      });
      console.log('FIDO Attestation Result', result);

      const converted = Meiling.Identity.User.convertToWebAuthnJSONObject(body.name, result);
      if (!converted) {
        throw new Meiling.V1.Error.MeilingError(
          Meiling.V1.Error.ErrorType.UNAUTHORIZED,
          'failed to verify webauthn registration request',
        );
      }

      const keyData = await getPrismaClient().authentication.create({
        data: {
          user: {
            connect: { id: user.id },
          },
          method: dbType as AuthenticationMethod,
          allowPasswordReset: true,
          allowTwoFactor: true,
          allowSingleFactor: true,
          data: converted as any,
        },
      });

      rep.send({ success: true });
    } catch (e) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, (e as Error).message);
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
