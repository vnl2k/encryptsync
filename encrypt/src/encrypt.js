"use strict";

const fs = require("fs"),
  Crypto = require("crypto"),
  Chokidar = require("chokidar"),
  Path = require("path"),
  { logMessage } = require('./utils'),
  { RSAencryption, GPGencryption } = require('./encryptors');

const getRelativePath = (file, source) => file.replace(source, "");
const getTargetPath = (file, source, target) => file.replace(source, target);
const switchEncryptors = (name) => {
  switch (name) {
    case "gpg":
      return GPGencryption;

    case "none":
    default:
      return RSAencryption;
  }
};

function encryptFiles(
  files,
  encryptor_options,
  source_path,
  target_path,
  errLogger,
  callback,
  scrambleNames = false
) {
  const fLen = files.length,
    MESSAGE_LIST = [],
    callbackCheck = (file, message, error) => {
      if (callback !== undefined) {
        MESSAGE_LIST.push({ path: file, message: message, error: error });

        if (MESSAGE_LIST.length === fLen) {
          callback(MESSAGE_LIST);
        }
      }
    };

  let {encryptor, extention: ext } = switchEncryptors(encryptor_options.method);
  encryptor = encryptor(encryptor_options, errLogger);

  if (Path.isAbsolute(source_path) === true && Path.isAbsolute(target_path) === true && fLen > 0)
    files.forEach(f => {
      let target_file,
        relative_path = getRelativePath(f, source_path);

      if (scrambleNames === true) {
        const fileName = Path.basename(f),
          filePath = Path.dirname(f),
          sha256 = Crypto.createHash("sha256");

        sha256.update(fileName);

        target_file = Path.resolve(filePath.replace(source_path, target_path), sha256.digest("hex") + ext);
      } else {
        target_file = getTargetPath(f, source_path, target_path) + ext;
      }

      // check the file exists
      fs.stat(f, (err, stats) => {
        if (err) {
          callbackCheck(target_file, undefined, err.message);
          return;
        }

        if (stats !== undefined && stats.isFile()) {
          switch (encryptor_options.method) {
            case "gpg":
              encryptor(f, (stdin, stdout) => {
                stdout
                  .on("close", () => callbackCheck(target_file, `Encrypted: ${relative_path}\n`))
                  .on("error", message => callbackCheck(target_file, message));

                stdout.pipe(fs.createWriteStream(target_file));

              });
              break;

            case "none":
            default:
              encryptor(f, encrypted_data => {
                fs.writeFile(target_file, encrypted_data, err => {
                  if (err) {
                    callbackCheck(target_file, undefined, err.message);
                  } else {
                    callbackCheck(target_file, `Encrypted: ${relative_path}\n`);
                  }
                });
              });
          }
        }
      });
    });
  else {
    errLogger("No files were encrypted!\n");
  }
}

module.exports = {
  encryptFiles: encryptFiles,

  RSAencryption: RSAencryption,

  GPGencryption: GPGencryption,

  monitor: (configPath, encryptFiles) => {
    const config = JSON.parse(fs.readFileSync(configPath)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      log_path = Path.join(Path.dirname(configPath), ".encryptsyncLog"),
      errLogger = logMessage(log_path, 'error'),
      opsLogger = logMessage(log_path, 'info'),
      options = config.options;

    opsLogger("Starting encryption monitor...");
    opsLogger(`Watching folder:\n\t${source_path}`);
    opsLogger("To exit press: CTRL + C");

    let Watcher = Chokidar.watch(source_path, {
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    Watcher
      .on("add", path =>
        encryptFiles([path], options, source_path, target_path, errLogger, list => {
          opsLogger(list.map(i => i.message || i.error).join("\n"));
        })
      )
      .on("change", path =>
        encryptFiles([path], options, source_path, target_path, errLogger, list => {
          opsLogger(list.map(i => i.message || i.error).join("\n"));
        })
      )
      .on("unlink", path => {
        let ext = switchEncryptors(options.method).extention;
        fs.unlinkSync(getTargetPath(path, source_path, target_path) + ext);
        opsLogger(`Removed file: ${getRelativePath(path, source_path)}\n`);
      });
	
    if (process.platform === "win32") {
      var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.on("SIGINT", function () {
        process.emit("SIGINT");
      });
    }

    process.on("SIGINT", function() {
      opsLogger("\nGoodbye!");
      Watcher.close();
      process.exit(0);
    });
  }
};
