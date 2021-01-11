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

export async function verifyChallengeV1(
  signinMethod: MeilingV1ExtendedAuthMethods,
  challenge: string,
  challengeResponse: any,
  data?: AuthorizationJSONObject,
) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      return validatePGPSign(challenge, challengeResponse, (data as AuthorizationPGPSSHKeyObject).data.key);
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      break;
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return challenge.trim() === challengeResponse.trim();
    case MeilingV1ExtendedAuthMethods.OTP:
      return validateOTP(challengeResponse, (data as AuthorizationOTPObject).data.secret);
  }
}
