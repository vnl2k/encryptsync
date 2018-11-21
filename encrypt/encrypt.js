"use strict";

const fs = require("fs"),
  crypto = require("crypto"),
  nodemon = require("nodemon"),
  Path = require("path");

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

function encryptFiles(
  files,
  publicKey,
  source_path,
  target_path,
  logger,
  callback,
  scrambleNames = false
) {
  let fLen = files.length;
  let count = [];
  let callbackCheck = f => {
    if (callback !== undefined) {
      count.push(f);
      if (count.length === fLen) callback(count);
    }
  };

  if (
    Path.isAbsolute(source_path) === true &&
    Path.isAbsolute(target_path) === true &&
    fLen > 0
  )
    files.forEach(f => {
      let target_file,
        relative_path = f.replace(source_path, "");

      if (scrambleNames === true) {
        const ext = Path.extname(f),
          fileName = Path.basename(f),
          filePath = Path.dirname(f),
          encryptedFileName = crypto
            .publicEncrypt(publicKey, Buffer.from(fileName))
            .toString("hex")
            .slice(0, 10); // length of file names is restricted!!

        target_file = Path.resolve(
          filePath.replace(source_path, target_path),
          encryptedFileName + ".rsaencrypt"
        );
      } else {
        target_file = f.replace(source_path, target_path) + ".rsaencrypt";
      }

      // check the file exists
      fs.stat(f, (err, stats) => {
        if (err) {
          callbackCheck(target_file);
          return logger(err);
        }

        if (stats !== undefined && stats.isFile()) {
          var file_buffer = fs.readFileSync(f);
          let encrypted = crypto.publicEncrypt(publicKey, file_buffer);

          fs.writeFile(target_file, encrypted, err => {
            if (err) {
              callbackCheck(target_file);
              return logger(err);
            }

            console.log(`[${Date()}] encrypted: ${relative_path}\n`);
            callbackCheck(target_file);
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
  monitor: config_json_path => {
    let config = JSON.parse(fs.readFileSync(config_json_path)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      error_log_path = Path.join(Path.dirname(config_json_path), "error.log"),
      logger = logMessage(error_log_path),
      publicKey = fs.readFileSync(config.public_key, "utf8");

    // nodemon looks for "watch" key in the config object
    config.watch = [source_path];
    config.script = Path.resolve("./encrypt.js");
    // This call to nodemon initialises nodemon within the script

    console.log("Starting encrypt monitor...");
    nodemon(config)
      .on("start", () => {})
      .on("restart", files => {
        encryptFiles(files, publicKey, source_path, target_path, logger);
      })
      .on("quit", function() {
        console.log("App has quit");
        process.exit(0);
      });
  }
};
