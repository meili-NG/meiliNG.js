/* eslint-disable @typescript-eslint/no-var-requires */
const Figlet = require('figlet');
const chalk = require('chalk');

const fs = require('fs');
const prompts = require('prompts');

const dotenv = require('dotenv');
dotenv.config();

const productName = 'meiliNG';
const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

console.log(Figlet.textSync(productName, 'Small Slant'));
console.log(`${chalk.bold(productName)} Configuration Utility - ${chalk.italic`v${packageJson.version}`}`);
console.log();

(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(chalk.redBright('x'), 'Database URL is not properly configured.');
    process.exit(1);
  }

  try {
    await prisma.$connect();
  } catch (e) {
    console.error(chalk.redBright('x'), 'Failed to connect database');
    process.exit(1);
  }

  try {
    const perms = ['openid', 'profile', 'name', 'email', 'address'];
    await Promise.all(
      perms.map(async (n) => {
        const perm = await prisma.permission.findUnique({
          where: {
            name: n,
          },
        });

        if (!perm) {
          await prisma.permission.create({
            data: {
              name: n,
            },
          });
        }
      }),
    );
  } catch (e) {
    console.error(chalk.redBright('x'), 'Failed to generate required permission/scope on database');
  }
})();
