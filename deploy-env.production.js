/* eslint-disable @typescript-eslint/no-var-requires */

const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

let keyFile = process.env.DEPLOY_PRODUCTION_KEY_PATH || undefined;
if (keyFile) keyFile.replace(/^~/g, os.homedir());

if (!keyFile) {
  const defaultKeyFile = path.join(os.homedir(), '.ssh', 'id_rsa');

  if (fs.existsSync(defaultKeyFile)) {
    keyFile = defaultKeyFile;
  }
}

const config = {
  privateKey: keyFile,
  host: process.env.DEPLOY_PRODUCTION_HOST,
  username: process.env.DEPLOY_PRODUCTION_USER,
  path: process.env.DEPLOY_PRODUCTION_PATH,
};

console.log(keyFile);

(async () => {
  const session = await ssh.connect({
    host: config.host,
    username: config.username,
    privateKey: config.privateKey,
  });

  const configFile = path.join(__dirname, 'config.js');
  const envFile = path.join(__dirname, '.env');

  const targetDir = path.join(config.path, 'current');

  if (fs.existsSync(envFile)) {
    session.putFile(envFile, path.join(targetDir, '.env'));
  } else if (fs.existsSync(configFile)) {
    // use js object style config
    session.putFile(configFile, path.join(targetDir, 'config.js'));
  }

  session.dispose();
  process.exit(0);
})();
