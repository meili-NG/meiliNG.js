import * as OpenPGP from 'openpgp';

export async function validatePGPSign(challenge: string, challengeResponse: string, publicKeyArmored: string) {
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
