/* eslint-disable @typescript-eslint/no-var-requires */
const Figlet = require('figlet');
const chalk = require('chalk');

const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

const productName = 'meiliNG';
const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

console.log(Figlet.textSync(productName, 'Small Slant'));
console.log(`${chalk.bold(productName)} Configuration Utility - ${chalk.italic`v${packageJson.version}`}`);
console.log();

console.error('Working in progress!');
