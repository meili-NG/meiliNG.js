// Meiling Gatekeeper Continous Deployment Test file
// Copyright (c) Alex4386, Distributed under MIT License

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, "..", "..");
const envFilePath = path.join(projectRoot, ".env");

const envFileCheck = fs.existsSync(envFilePath);
if (!envFileCheck) {
  console.error(`${
    chalk.redBright(
      chalk.bold`Error: .env configuration missing!`
  )}`);
  process.exit(1);
} 

const values = dotenv.parse(fs.readFileSync(envFilePath, {encoding: 'utf-8'}));
if (Object.keys(values).length === 0) {
  console.error(`${
    chalk.redBright(
      chalk.bold`Error: invalid .env configuration!`
  )}`);
  process.exit(1);
} 

const key = process.env.DEPLOY_KEY
if (!key) {
  console.error(`${
    chalk.redBright(
      chalk.bold`Error: invalid deploy key!`
  )}`);
  process.exit(1);
}


