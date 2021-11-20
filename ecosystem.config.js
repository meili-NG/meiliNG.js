/* eslint-disable @typescript-eslint/no-var-requires */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

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
      'pre-deploy-local': `scp -Cr ./.env ${process.env.IS_GITHUB_ACTIONS ? "-i ~/.ssh/id_rsa_deploy" : ""} ${process.env.DEPLOY_PRODUCTION_USER}@${process.env.IS_GITHUB_ACTIONS ? process.env.S4AIT_DEPLOY_TARGET : process.env.DEPLOY_PRODUCTION_HOST}:${process.env.DEPLOY_PRODUCTION_PATH}/current`,
      'post-deploy': `yarn && yarn build && yarn generate && yarn prisma migrate deploy && pm2 startOrRestart ecosystem.config.js`,
    },
  },
};
