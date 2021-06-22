import fs from 'fs';
import path from 'path';
import { ConfigInterface } from '../interface';

const configFileExists = fs.existsSync(path.join(__dirname, '../../config.js'));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: ConfigInterface = configFileExists ? require('../../config') : require('../../config.env');

export default config;
