import { Authorization } from '@prisma/client';
import { MeilingV1Challenge, MeilingV1Database } from '.';
import { Token } from '../../../../common';
import { AuthorizationJSONObject, AuthorizationOTPObject, AuthorizationPGPSSHKeyObject } from '../../../../common/user';
import { validateOTP, validatePGPSign } from '../../../../common/validate';
import config from '../../../../config';
import {
  MeilingV1ExtendedAuthMethods,
  MeilingV1SignInExtendedAuthentication,
  MeilingV1SigninType,
} from '../interfaces/query';

export function getMeilingAvailableAuthMethods(
  authMethods: Authorization[],
  body?: MeilingV1SignInExtendedAuthentication,
) {
  const methods: MeilingV1ExtendedAuthMethods[] = [];

  for (const thisMethod of authMethods) {
    const methodMeilingV1 = MeilingV1Database.convertAuthenticationMethod(thisMethod.method);
    if (methodMeilingV1 !== null) {
      let methodAllowed = true;

      if (body) {
        methodAllowed = MeilingV1Challenge.isChallengeMethodAdequate(body, methodMeilingV1);
      }

      if (methodAllowed) {
        if (!methods.includes(methodMeilingV1)) {
          methods.push(methodMeilingV1);
        }
      }
    }
  }

  return methods;
}

export function isChallengeRateLimited(signinMethod: MeilingV1ExtendedAuthMethods, issuedAt?: Date) {
  if (issuedAt) {
    if (signinMethod === MeilingV1ExtendedAuthMethods.SMS) {
      return (
        new Date().getTime() - new Date(issuedAt).getTime() <
        config.token.invalidate.meiling.CHALLENGE_TOKEN_SMS_RATE_LIMIT * 1000
      );
    } else if (signinMethod === MeilingV1ExtendedAuthMethods.EMAIL) {
      return (
        new Date().getTime() - new Date(issuedAt).getTime() <
        config.token.invalidate.meiling.CHALLENGE_TOKEN_EMAIL_RATE_LIMIT * 1000
      );
    }
  }

  return false;
}

export function generateChallenge(signinMethod: MeilingV1ExtendedAuthMethods) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      return Token.generateToken();
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return Token.generateToken(6, '0123456789');
    case MeilingV1ExtendedAuthMethods.OTP:
    default:
      return undefined;
  }
}

export function shouldSendChallenge(signinMethod: MeilingV1ExtendedAuthMethods) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      return true;
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return false;
    case MeilingV1ExtendedAuthMethods.OTP:
    default:
      return undefined;
  }
}

export function isChallengeMethodAdequate(
  body: MeilingV1SignInExtendedAuthentication,
  method?: MeilingV1ExtendedAuthMethods,
): boolean {
  method = method !== undefined ? method : body.data?.method;

  if (body.type === MeilingV1SigninType.PASSWORDLESS) {
    switch (method) {
      case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
        return true;
      case MeilingV1ExtendedAuthMethods.SMS:
      case MeilingV1ExtendedAuthMethods.OTP:
      case MeilingV1ExtendedAuthMethods.EMAIL:
        return body.context !== undefined && body.context.username !== undefined;
      default:
        return false;
    }
  } else if (body.type === MeilingV1SigninType.TWO_FACTOR_AUTH) {
    switch (method) {
      case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      case MeilingV1ExtendedAuthMethods.SMS:
      case MeilingV1ExtendedAuthMethods.OTP:
      case MeilingV1ExtendedAuthMethods.EMAIL:
        return true;
      default:
        return false;
    }
  } else {
    return true;
  }
}

export async function verifyChallenge(
  signinMethod: MeilingV1ExtendedAuthMethods,
  challenge: string | undefined,
  challengeResponse: any,
  data?: AuthorizationJSONObject,
) {
  try {
    switch (signinMethod) {
      case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
        return await validatePGPSign(
          challenge as string,
          challengeResponse,
          (data as AuthorizationPGPSSHKeyObject).data.key,
        );
      case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
        break;
      case MeilingV1ExtendedAuthMethods.SMS:
      case MeilingV1ExtendedAuthMethods.EMAIL:
        return (challenge as string).trim() === challengeResponse.trim();
      case MeilingV1ExtendedAuthMethods.OTP:
        return validateOTP(challengeResponse, (data as AuthorizationOTPObject).data.secret);
    }
  } catch (e) {
    return false;
  }
}
