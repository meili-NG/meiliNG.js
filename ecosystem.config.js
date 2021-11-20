/* eslint-disable @typescript-eslint/no-var-requires */

const dotenv = require('dotenv');
const path = require('path');
const os = require('os');

dotenv.config({ path: path.join(__dirname, '.env') });

let keyFile = process.env.DEPLOY_PRODUCTION_KEY_PATH || undefined;
if (keyFile) keyFile.replace(/^~/g, os.homedir());

let keyOption = "";
if (keyOption) keyOption += "-i \""+keyFile+"\"";

module.exports = {
  apps: [
    {
      name: 'Meiling Gatekeeper',
      cwd: '.',
      script: 'yarn',
      args: ['start', '--no-cleanup'],
      env: {
        // You should configure it here.
        NODE_ENV: 'production',

        ...process.env,
      },
    },
  ],

  deploy: {
    production: {
      user: process.env.DEPLOY_PRODUCTION_USER,
      host: process.env.DEPLOY_PRODUCTION_HOST,
      ref: 'origin/main',
      repo: 'https://github.com/meiling-gatekeeper/meiling',
      path: process.env.DEPLOY_PRODUCTION_PATH,
      'pre-deploy-local': `scp -o StrictHostKeyChecking=no -o LogLevel=QUIET ${keyOption} -Cr ./.env ${process.env.DEPLOY_PRODUCTION_USER}@${process.env.DEPLOY_PRODUCTION_HOST}:${process.env.DEPLOY_PRODUCTION_PATH}/current`,
      'post-deploy': `yarn && yarn build && yarn generate && yarn prisma migrate deploy && pm2 startOrRestart ecosystem.config.js`,
    },
  },
};
