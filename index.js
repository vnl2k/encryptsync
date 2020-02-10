'use strict';
const Path = require('path');

const KEY_LOOKUP = {
  '--source': 'source_path',
  '--target': 'target_path',
  email: 'email'
};


function getKeyValuePair(key) {
  let ind = process.argv.indexOf(key);
  if (ind > -1 && process.argv[ind+1] !== undefined) {
    return [KEY_LOOKUP[key], process.argv[ind+1]];
  } else {
    return;
  }
}

const { monitor, encryptFile } = require('./src/encrypt');

const CONFIG_PATH = getKeyValuePair('--config');

if (CONFIG_PATH !== undefined) {
  return monitor(CONFIG_PATH[1], encryptFile);
}

const inmemoryConfig = ['--target', '--source', '--email']
  .map( key => getKeyValuePair(key))
  .filter( i => i !== undefined)

if (inmemoryConfig.length === 3) {
  return monitor(inmemoryConfig.reduce( (obj, i) => obj[i[0]] = i[1] && obj, {}), encryptFile)
} else {
  console.log(
    `ERROR: An initialization parameter must be missing. Please specify \`--target\`, \`--source\` and \`--email\`
Encrypt-Sync will exit immediately.`)

  setTimeout(() => process.exit(1), 10);
}

monitor(Path.join(process.env.HOME, '.encryptsyncrc'), encryptFile);

