"use strict";

const fs = require("fs"),
  Crypto = require("crypto"),
  nodemon = require("nodemon"),
  Path = require("path"),
  { spawn } = require("child_process");

const logMessage = log_path => message => {
  fs.appendFile(
    log_path,
    ["[", Date(), "] ", message, "\n"].join(""),
    "utf8",
    err => {
      if (err) throw err;
    }
  );
};

function RSAencryption(options) {
  const publicKey = fs.readFileSync(options.public_key, "utf8");

  return function(file, callback) {
    callback(Crypto.publicEncrypt(publicKey, fs.readFileSync(file)));
  };
}

function GPGencryption(options, logger) {
  const gpg = spawn("gpg", ["-e", "-r", options.email, "--output", "-"], {
    stdio: [
      "pipe", // Pipe child's stdin to pipe
      "pipe", // Pipe child's stdout to pipe
      "pipe" // Direct child's stderr to pipe
    ]
  });

  gpg.stderr.on("message", message => logger(`GPG stderr: ${message}`));
  gpg.on("error", message => logger(`GPG error: ${message}`));

  return function(file_name, callback) {
    gpg.stdin.write(file_name);
    gpg.stdout.on("data", data => callback(data));
    // gpg.stdout.on("readable", function() {
    //   console.log('readable');
    //   let data;

    //   while (data = gpg.stdout.read()) {
    //     console.log(data)
    //     callback(data);
    //   }
    // });

    // OR pipe stringht to a file
    //const writable = fs.createWriteStream('file.txt');
    // // All the data from readable goes into 'file.txt'
    // readable.pipe(writable);
  };
}

function encryptFiles(
  files,
  encryptor_options,
  source_path,
  target_path,
  logger,
  callback, // used for testing purposes at the moment
  scrambleNames = false
) {
  const fLen = files.length,
    count = [],
    callbackCheck = f => {
      if (callback !== undefined) {
        count.push(f);
        if (count.length === fLen) callback(count);
      }
    };

  let encryptor,
    enc_ext;
  switch (encryptor_options.method) {
    case "gpg":
      encryptor = GPGencryption(encryptor_options, logger);
      enc_ext = ".gpg";
      break;

    case "none":
    default:
      encryptor = RSAencryption(encryptor_options);
      enc_ext = ".rsa";
  }

  if (
    Path.isAbsolute(source_path) === true &&
    Path.isAbsolute(target_path) === true &&
    fLen > 0
  )
    files.forEach(f => {
      let target_file,
        relative_path = f.replace(source_path, "");

      if (scrambleNames === true) {
        const fileName = Path.basename(f),
          filePath = Path.dirname(f),
          sha256 = Crypto.createHash("sha256");

        sha256.update(fileName);

        target_file = Path.resolve(
          filePath.replace(source_path, target_path),
          sha256.digest("hex") + enc_ext
        );
      } else {
        target_file = f.replace(source_path, target_path) + enc_ext;
      }

      // check the file exists
      fs.stat(f, (err, stats) => {
        if (err) {
          callbackCheck(target_file);
          return logger(err);
        }

        if (stats !== undefined && stats.isFile()) {
          encryptor(f, encrypted_data => {
            console.log(encrypted_data.length)
            fs.writeFile(target_file, encrypted_data, err => {
              if (err) {
                callbackCheck(target_file);
                return logger(err);
              }

              console.log(`[${Date()}] encrypted: ${relative_path}\n`);
              callbackCheck(target_file);
            });
          });
        }
      });
    });
  else {
    console.log(`[${Date()}] no files were encrypted. Bad inputs!\n`);
  }
}

module.exports = {
  encryptFiles: encryptFiles,

  logMessage: logMessage,

  RSAencryption: RSAencryption,

  GPGencryption: GPGencryption,

  monitor: config_json_path => {
    let config = JSON.parse(fs.readFileSync(config_json_path)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      error_log_path = Path.join(Path.dirname(config_json_path), "error.log"),
      logger = logMessage(error_log_path);

    // nodemon looks for "watch" key in the config object
    config.watch = [source_path];
    config.script = Path.resolve("./encrypt.js");

    console.log("Starting encrypt monitor...");
    nodemon(config)
      .on("start", () => {})
      .on("restart", files => {
        encryptFiles(files, config.options, source_path, target_path, logger);
      })
      .on("quit", function() {
        console.log("App has quit");
        process.exit(0);
      });
  }
};
