// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require('chalk');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prompts = require('prompts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const envFile = path.join(__dirname, '.env');

// load dotenv if necessary.
dotenv.config({ path: envFile });

if (process.env.OPENID_JWT_ALGORITHM || process.env.OPENID_JWT_PUBLIC_KEY || process.env.OPENID_JWT_PRIVATE_KEY) {
  console.error(chalk.redBright('It seems .env file is already configured.'));
  console.error('If you want to continue, Please delete OPENID_JWT* env variables from .env');
  process.exit(1);
}

(async () => {
  const algorithm = (
    await prompts({
      type: 'select',
      name: 'algorithm',
      message: 'Which Algorithm do you want to use to sign ID Token?',
      choices: [
        { title: 'RS256', description: 'The go-to signing algorithm for JWT', value: 'RS256' },
        { title: 'RS384', value: 'RS384' },
        { title: 'RS512', value: 'RS384' },

        { title: 'ES256K', description: 'The modern signing algorithm for JWT', value: 'ES256K' },
        { title: 'ES384', value: 'ES384' },
        { title: 'ES512', value: 'ES512' },
      ],
      initial: 0,
    })
  ).algorithm;

  if (!algorithm) {
    console.error(chalk.redBright(chalk.bold('Unexpected algorithm.'), 'Please report to Issues'));
    throw new Error('unexepected algorithm');
  }

  const keyType = algorithm.startsWith('RS') ? 'rsa' : algorithm.startsWith('ES') ? 'ec' : undefined;

  if (!keyType) {
    console.error(chalk.redBright(chalk.bold('Unexpected algorithm.'), 'Please report to Issues'));
    throw new Error('unexepected algorithm');
  }

  let keyGenData;
  if (keyType === 'rsa') {
    const modulusLength = (
      await prompts({
        type: 'select',
        name: 'result',
        message: 'Specify the key length',
        choices: [
          { title: 'RSA-2048', description: 'Performance with decent cryptographic power', value: 2048 },
          { title: 'RSA-4096', description: 'Cryptographic power to extreme', value: 2048 },
        ],
        initial: 0,
      })
    ).result;

    keyGenData = {
      modulusLength,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    };
  } else {
    const namedCurve =
      algorithm === 'ES256K'
        ? 'secp256k1'
        : algorithm === 'ES384'
        ? 'secp384r1'
        : algorithm === 'ES521'
        ? 'secp521r1'
        : undefined;

    if (!namedCurve) {
      console.error(chalk.redBright(chalk.bold('Unexpected algorithm.'), 'Please report to Issues'));
      throw new Error('unexepected algorithm');
    }

    keyGenData = {
      namedCurve,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    };
  }

  let pubPassphrase = (
    await prompts({
      type: 'confirm',
      name: 'result',
      message: 'Do you want to set passphrase for public key?',
    })
  ).result;

  if (pubPassphrase) {
    pubPassphrase = (
      await prompts({
        type: 'password',
        name: 'result',
        message: 'Enter passphrase for public key',
      })
    ).result;
  } else {
    pubPassphrase = undefined;
  }

  let privPassphrase = (
    await prompts({
      type: 'confirm',
      name: 'result',
      message: 'Do you want to set passphrase for private key?',
    })
  ).result;

  if (privPassphrase) {
    privPassphrase = (
      await prompts({
        type: 'password',
        name: 'result',
        message: 'Enter passphrase for private key',
      })
    ).result;
  } else {
    privPassphrase = undefined;
  }

  keyGenData.publicKeyEncoding.passphrase = pubPassphrase;
  keyGenData.publicKeyEncoding.cipher = pubPassphrase ? 'aes-256-cbc' : undefined;

  keyGenData.privateKeyEncoding.passphrase = privPassphrase;
  keyGenData.privateKeyEncoding.cipher = privPassphrase ? 'aes-256-cbc' : undefined;

  const generatedKey = crypto.generateKeyPairSync(keyType, keyGenData);

  console.log(chalk.cyanBright(chalk.bold('Congratulations!')));
  console.log('You have generated keys for signing your keys!');
  console.log();

  const pubKey = generatedKey.publicKey;
  const privKey = generatedKey.privateKey;

  const envFileOutput =
    '\n\n' +
    `# OPENID JWT CONFIGURATION\n` +
    `OPENID_JWT_ALGORITHM="${algorithm}"\n` +
    `OPENID_JWT_PUBLIC_KEY=${JSON.stringify(pubKey)}\n` +
    (pubPassphrase ? `OPENID_JWT_PUBLIC_KEY_PASSPHRASE=${JSON.stringify(pubPassphrase)}\n` : '') +
    `OPENID_JWT_PRIVATE_KEY=${JSON.stringify(privKey)}\n` +
    (privPassphrase ? `OPENID_JWT_PRIVATE_KEY_PASSPHRASE=${JSON.stringify(privPassphrase)}\n` : '');

  let applyNow = false;

  if (fs.existsSync(envFile)) {
    applyNow = (
      await prompts({
        type: 'confirm',
        name: 'result',
        message: '.env file was found.',
      })
    ).result;
  }

  if (applyNow) {
    fs.appendFileSync(envFile, envFileOutput);
    console.log(chalk.greenBright('Configuration was applied to ', chalk.bold('.env'), 'file!'));
  } else {
    console.log('Please manually configure the following:');
    console.log('openid.jwt.algorithm:', algorithm);
    console.log('openid.jwt.publicKey.key:', pubKey);
    if (pubPassphrase) console.log('openid.jwt.publicKey.passphrase:', pubPassphrase);
    console.log('openid.jwt.privateKey.key:', privKey);
    if (privPassphrase) console.log('openid.jwt.privateKey.passphrase:', privPassphrase);
  }
})();
