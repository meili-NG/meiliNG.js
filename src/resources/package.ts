import fs from 'fs';

export const info = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
