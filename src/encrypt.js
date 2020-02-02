'use strict';

const fs = require('fs'),
  fsp = fs.promises,
  Chokidar = require('chokidar'),
  Path = require('path'),
  { logMessage } = require('./utils'),
  { GPGencryption } = require('./encryptors'),
  { encryptor: encryptorTemplate, extention: file_extention } = GPGencryption;

const getRelativePath = (file, source) => file.replace(source, '');
const getTargetPath = (file, source, target) => file.replace(source, target);

function encryptFile(encryptor, file_extention, source_path, target_path) {
  return f => {
    let target_file = getTargetPath(f, source_path, target_path) + file_extention;

    // check that the target folder path exists
    let targetFilePath = Path.dirname(target_file);

    // if the target folder does NOT exist, create it
    let targetFolderCheck = fsp
      .stat(targetFilePath)
      .catch(() => fsp.mkdir(targetFilePath, { recursive: true }));

    // check the file exists: fsp.stat(f)
    return Promise.all([fsp.stat(f), targetFolderCheck]).then(() =>
      encryptor(f).then(
        gpg =>
          new Promise((resolve, reject) => {
            gpg.stderr.on('message', message => reject(`GPG std error: ${message}`));
            gpg.on('error', message => reject(`GPG error: ${message}`));
            gpg.stdout
              .on('close', () => resolve(target_file))
              .on('error', message => reject(message));

            gpg.stdout.pipe(fs.createWriteStream(target_file));
          })
      )
    );
  };
}

module.exports = {
  encryptFile,

  monitor: (configPath, encryptFile) => {
    const config = JSON.parse(fs.readFileSync(configPath)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      log_path = Path.join(Path.dirname(configPath), '.encryptsyncLog'),
      errLogger = logMessage(log_path, 'error'),
      opsLogger = logMessage(log_path, 'info'),
      options = config.options;

    opsLogger('Starting encryption monitor...');
    opsLogger(`Watching folder: ${source_path}`);
    opsLogger('To exit press: CTRL + C');

    const encryptor = encryptFile(
      encryptorTemplate(options),
      file_extention,
      source_path,
      target_path
    );

    let Watcher = Chokidar.watch(source_path, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\../,
      persistent: true
    });

    Watcher.on('add', path =>
      encryptor(path)
        .then(path => opsLogger(`Encrypted: ${getRelativePath(path, source_path)}\n`))
        .catch(err => errLogger(err.message || err))
    )
      .on('addDir', path => {
        fs.mkdirSync(getTargetPath(path, source_path, target_path), {recursive: true});
        opsLogger(`Added folder: ${getRelativePath(path, source_path)}\n`);
      })
      .on('change', path =>
        encryptor(path)
          .then(path => opsLogger(`Encrypted: ${getRelativePath(path, source_path)}\n`))
          .catch(err => errLogger(err.message || err))
      )
      .on('unlink', path => {
        fs.unlinkSync(getTargetPath(path, source_path, target_path) + file_extention);
        opsLogger(`Removed file: ${getRelativePath(path, source_path)}\n`);
      })
      .on('unlinkDir', path => {
        fs.rmdirSync(getTargetPath(path, source_path, target_path), {recursive: true});
        opsLogger(`Removed folder: ${getRelativePath(path, source_path)}\n`);
      });

    if (process.platform === 'win32') {
      var rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.on('SIGINT', function() {
        process.emit('SIGINT');
      });
    }

    process.on('SIGINT', function() {
      opsLogger('\nGoodbye!');
      Watcher.close();
      process.exit(0);
    });
  }
};
