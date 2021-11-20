// Meiling Gatekeeper Continous Deployment Test file
// Copyright (c) Alex4386, Distributed under MIT License

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, "..", "..");
const envFilePath = path.join(projectRoot, ".env");

const envFileCheck = fs.existsSync(envFilePath);
if (!envFileCheck) process.exit(1);

const values = dotenv.parse(fs.readFileSync(envFilePath, {encoding: 'utf-8'}));

console.log("Debug:");
console.log(Object.keys(values));
