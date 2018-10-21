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

function encryptFiles(files, publicKey, source_path, target_path, logger, callback) {
  let fLen = files.length;
  let count = [];
  let callbackCheck = f => {
    if (callback !== undefined) {
      count.push(f);
      if (count.length === fLen) callback(count);
    }
  };

  if (fLen > 0)
    files.forEach(f => {
      let file_name = f + ".enc";
      let target_file = file_name.replace(source_path, target_path);
      let relative_path = file_name.replace(source_path, "");

      // check the file exists
      fs.stat(f, (err, stats) => {
        if (err) {
          callbackCheck(target_file);
          return logger(err);
        }

        if (stats !== undefined && stats.isFile()) {
          var file_buffer = fs.readFileSync(f);
          let encrypted = crypto.publicEncrypt(publicKey, file_buffer);
          
          fs.writeFileSync(file_name, encrypted);
          
          fs.copyFile(file_name, target_file, err => {
            if (err) {
              callbackCheck(target_file);
              return logger(err);
            }

            fs.unlink(file_name, err => {
              if (err) logger(err);
              console.log(`[${Date()}] moving: ${relative_path}\n`);
              callbackCheck(target_file);
            });
          });
        }
      });
    });
}

module.exports = {
  encryptFiles: encryptFiles,
  logMessage: logMessage,
  monitor: (config_json_path) => {

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
      .on("start", () => {
      })
      .on("restart", files => {
        encryptFiles(files, publicKey, source_path, target_path, logger);
      })
      .on("quit", function() {
        console.log("App has quit");
        process.exit(0);
      });
  }
};
