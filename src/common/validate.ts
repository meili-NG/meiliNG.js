import * as OpenPGP from 'openpgp';
import * as SpeakEasy from 'speakeasy';

import { PhoneNumber } from 'libphonenumber-js';
import axios from 'axios';
import config from '../config';

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

export async function sendOTPSMS(phone: PhoneNumber, challenge: string) {
  if (!config.notificationApi) {
    throw new Error();
  }

  const host = config.notificationApi.host;
  const key = config.notificationApi.key;

  await axios.post(
    `${host}/v1/sms`,
    {
      type: 'template',
      templateId: 'authorization_code',
      lang: 'ko',
      messages: [
        {
          to: phone.formatInternational(),
          variables: {
            코드: challenge,
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    },
  );
}
