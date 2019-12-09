'use strict';

const fs = require('fs'),
  fsp = fs.promises,
  Chokidar = require('chokidar'),
  Path = require('path'),
  { logMessage, sha256Name } = require('./utils'),
  { RSAencryption, GPGencryption } = require('./encryptors');

const getRelativePath = (file, source) => file.replace(source, '');
const getTargetPath = (file, source, target) => file.replace(source, target);
const switchEncryptors = name => {
  switch (name) {
    case 'gpg':
      return GPGencryption;

    case 'none':
    default:
      return RSAencryption;
  }
};

function encryptFile(
  encryptor,
  file_extention,
  method,
  source_path,
  target_path,
  callback,
  scrambleNames = false
) {
  return f => {
    let target_file = getTargetPath(f, source_path, target_path) + file_extention,
      relative_path = getRelativePath(f, source_path);

    if (scrambleNames === true) {
      // FIX ME!! REPLAVE SHA-256 WITH RSA ENCRYPTION
      target_file = Path.resolve(
        Path.dirname(target_file),
        sha256Name(Path.basename(f)) + file_extention
      );
    }

    // check that the target folder path exists
    let targetFilePath = Path.dirname(target_file);

    const targetFolderCheck = fsp.stat(targetFilePath).catch(() => {
      // if the folder does NOT exist, create it
      return fsp.mkdir(targetFilePath, { recursive: true });
    });

    // check the file exists: fsp.stat(f)
    Promise.all([fsp.stat(f), targetFolderCheck])
      .then(() => {
        switch (method) {
          case 'gpg':
            encryptor(f, (stdin, stdout) => {
              stdout
                .on('close', () => callback(target_file, `Encrypted: ${relative_path}\n`))
                .on('error', message => callback(target_file, message));

              stdout.pipe(fs.createWriteStream(target_file));
            });
            break;

          case 'none':
          default:
            encryptor(f, encrypted_data => {
              fs.writeFile(target_file, encrypted_data, err => {
                if (err) {
                  callback(target_file, err.message);
                } else {
                  callback(target_file, `Encrypted: ${relative_path}\n`);
                }
              });
            });
        }
      })
      .catch(err => callback(target_file, err.message));
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

    const { encryptor: encryptorTemplate, extention: file_extention } = switchEncryptors(
      options.method
    );

    const encryptor = encryptFile(
      encryptorTemplate(options, errLogger),
      file_extention,
      options.method,
      source_path,
      target_path,
      (target, message) => opsLogger(message)
    );

    // FIX ME: ALLOW THE CONFIG SETTINGS TO APPLY
    let Watcher = Chokidar.watch(source_path, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\../,
      persistent: true
    });

    Watcher.on('add', path => encryptor(path))
      .on('change', path => encryptor(path))
      .on('unlink', path => {
        let ext = switchEncryptors(options.method).extention;
        fs.unlinkSync(getTargetPath(path, source_path, target_path) + ext);
        opsLogger(`Removed file: ${getRelativePath(path, source_path)}\n`);
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
