'use strict';

const Chokidar = require('chokidar');

const Crypto = require('crypto'),
  Path = require('path'),
  Fs = require('fs'),
  FsPromise = require('fs').promises;

const logMessage = (log_path, tags, toConsole = true) => message => {
  let fullMessage = `[${new Date().toLocaleTimeString()}] [${tags}] ${message}`;

  if (toConsole === true) console.log(fullMessage);

  Fs.appendFile(log_path, fullMessage + '\n', 'utf8', err => {
    if (err) throw err;
  });
};

// NOT IN USE ATM
function deleteGPGFiles(files) {
  Promise.all(files.map(f => FsPromise.unlink(f)))
    .then(() => console.log(files))
    .catch(err => console.log(err));
}

// NOT IN USE ATM
const sha256Name = file => {
  const fileName = Path.basename(file),
    sha256 = Crypto.createHash('sha256');

  sha256.update(fileName);
  return sha256.digest('hex');
};

const compareTrees = (source_path, target_path) => {
  let Watcher = Chokidar.watch(source_path, {
    ignoreInitial: false,
    persistent: true
  });
  // console.log(Watcher.getWatched());
};

module.exports = {
  deleteGPGFiles, // NOT IN USE ATM
  logMessage,
  sha256Name, // NOT IN USE ATM
  compareTrees
};
