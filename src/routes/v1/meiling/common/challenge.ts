import { generateToken } from '../../../../common';
import { AuthorizationJSONObject, AuthorizationPGPSSHKeyObject, AuthorizationOTPObject } from '../../../../common/user';
import { validatePGPSign, validateOTP } from '../../../../common/validate';
import { MeilingV1ExtendedAuthMethods } from '../interfaces/query';

export function generateChallengeV1(signinMethod: MeilingV1ExtendedAuthMethods) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      return generateToken();
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return generateToken(6, '0123456789');
    case MeilingV1ExtendedAuthMethods.OTP:
    default:
      return undefined;
  }
}

export function shouldSendChallengeV1(signinMethod: MeilingV1ExtendedAuthMethods) {
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

export async function verifyChallengeV1(
  signinMethod: MeilingV1ExtendedAuthMethods,
  challenge: string | undefined,
  challengeResponse: any,
  data?: AuthorizationJSONObject,
) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      return validatePGPSign(challenge as string, challengeResponse, (data as AuthorizationPGPSSHKeyObject).data.key);
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      break;
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return (challenge as string).trim() === challengeResponse.trim();
    case MeilingV1ExtendedAuthMethods.OTP:
      return validateOTP(challengeResponse, (data as AuthorizationOTPObject).data.secret);
  }
}
