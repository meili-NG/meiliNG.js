import * as OpenPGP from 'openpgp';
import * as SpeakEasy from 'speakeasy';

export async function validatePGPSign(
  challenge: string,
  challengeResponse: string,
  publicKeyArmored: string,
  validUntil?: Date,
) {
  let message;
  try {
    message = await OpenPGP.cleartext.readArmored(challengeResponse);
  } catch (e) {
    try {
      message = await OpenPGP.message.readArmored(challengeResponse);
    } catch (e) {
      throw new Error('');
    }
  }

  const verification = await OpenPGP.verify({
    message: message,
    publicKeys: (await OpenPGP.key.readArmored(publicKeyArmored)).keys,
  });

  const recoveredChallenge = Buffer.from(verification.data).toString('utf-8');

  let isSignaturesValid = true;
  for (const signature of verification.signatures) {
    isSignaturesValid = isSignaturesValid && signature.valid;
  }

  return recoveredChallenge.trim() == challenge.trim() && isSignaturesValid;
}

export function validateOTP(challengeResponse: string, secret: string) {
  return SpeakEasy.totp.verify({
    secret,
    encoding: 'base32',
    token: challengeResponse.trim(),
  });
}

export function sendOTPSMS(phones: string[], challenge: string) {
  for (const phone of phones) {
    console.log(`pseudo-request: created challenge (${challenge}) for ${phone}`);
  }
}
