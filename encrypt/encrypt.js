"use strict";

const fs = require("fs"),
  Crypto = require("crypto"),
  Chokidar = require("chokidar"),
  Path = require("path"),
  { logMessage } = require('./src/utils'),
  { RSAencryption, GPGencryption } = require('./src/encryptors');

// // used for loggin errors at the moment
// const logMessage = (log_path, toConsole=true) => message => {
//   if (toConsole === true) console.log(["[", (new Date()).toLocaleTimeString(), "] ", message, "\n"].join(""));

//   fs.appendFile(log_path, ["[", Date(), "] ", message, "\n"].join(""), "utf8", err => {
//     if (err) throw err;
//   });

// };

// function RSAencryption(options) {
//   const publicKey = fs.readFileSync(options.public_key, "utf8");

//   return function(file, callback) {
//     callback(Crypto.publicEncrypt(publicKey, fs.readFileSync(file)));
//   };
// }

// function GPGencryption(options, errLogger) {
//   return function(file_name, callback) {
//     // trust-model = auto: Skip  key  validation  and  assume that used keys are always fully trusted.
//     let gpg = spawn("gpg", ["-e", "-r", options.email, "--trust-model", "always", "--output", "-", file_name]);

//     gpg.stderr.on("message", message => errLogger(`GPG std error: ${message}`));
//     gpg.on("error", message => errLogger(`GPG error: ${message}`));

//     callback(gpg.stdin, gpg.stdout);
//   };
// }

function encryptFiles(files, encryptor_options, source_path, target_path, errLogger, callback, scrambleNames = false) {
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

  let encryptor, enc_ext;
  switch (encryptor_options.method) {
    case "gpg":
      encryptor = GPGencryption(encryptor_options, errLogger);
      enc_ext = ".gpg";
      break;

    case "none":
    default:
      encryptor = RSAencryption(encryptor_options);
      enc_ext = ".rsa";
  }

  if (Path.isAbsolute(source_path) === true && Path.isAbsolute(target_path) === true && fLen > 0)
    files.forEach(f => {
      let target_file,
        relative_path = f.replace(source_path, "");

      if (scrambleNames === true) {
        const fileName = Path.basename(f),
          filePath = Path.dirname(f),
          sha256 = Crypto.createHash("sha256");

        sha256.update(fileName);

        target_file = Path.resolve(filePath.replace(source_path, target_path), sha256.digest("hex") + enc_ext);
      } else {
        target_file = f.replace(source_path, target_path) + enc_ext;
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

                // // triggers file encryption
                // stdin.write(f);
                // stdin.end();
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
    errLogger(`[${Date()}] No files were encrypted!\n`);
  }
}

module.exports = {
  encryptFiles: encryptFiles,

  logMessage: logMessage,

  RSAencryption: RSAencryption,

  GPGencryption: GPGencryption,

  monitor: (config_json_path, encryptFiles) => {
    let config = JSON.parse(fs.readFileSync(config_json_path)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      log_path = Path.join(Path.dirname(config_json_path), "encrypt-monitor.log"),
      errLogger = logMessage(log_path),
      opsLogger = logMessage(log_path);

    // nodemon looks for "watch" key in the config object
    config.watch = [source_path];
    config.script = Path.resolve("./encrypt.js");

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
        encryptFiles([path], config.options, source_path, target_path, errLogger, list => {
          opsLogger(list.map(i => i.message || i.error).join("\n"));
        })
      )
      .on("change", path =>
        encryptFiles([path], config.options, source_path, target_path, errLogger, list => {
          opsLogger(list.map(i => i.message || i.error).join("\n"));
        })
      )
      .on("unlink", path => opsLogger(`File ${path} has been removed`));
	
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
