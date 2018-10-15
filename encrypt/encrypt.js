"use strict";

const fs = require("fs"),
  { spawn } = require("child_process"),
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

function initGPG(email) {
  let gpg = spawn("gpg", ["-e", "-r", email, "--multifile"]);

  gpg.on("error", err => logMessage(err));
  // .on("close", (code, signal) => {console.log("close event")});

  // gpg.stdout.on("end", () => {
  //   // END event is emitted when gpg is done encrypting the files
  // });

  return gpg;
}

function encryptFiles(gpg, files, source_path, target_path, logger, callback) {
  gpg.on("exit", (code, signal) => {
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
        let file_name = f + ".gpg";
        let target_file = file_name.replace(source_path, target_path);
        let relative_path = file_name.replace(source_path, "");

        fs.stat(file_name, (err, stats) => {
          if (err) {
            callbackCheck(target_file);
            return logger(err);
          }

          if (stats !== undefined && stats.isFile()) {
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
  });

  // encrypt the files
  gpg.stdin.write(files.map(f => f + "\n").join(""));
  gpg.stdin.end();
}

module.exports = {
  encryptFiles: encryptFiles,
  initGPG: initGPG,
  logMessage: logMessage,
  monitor: (email, config_json_path) => {

    let GPG, config = JSON.parse(fs.readFileSync(config_json_path)),
      source_path = Path.resolve(config.source_path),
      target_path = Path.resolve(config.target_path),
      error_log_path = Path.join(Path.dirname(config_json_path), "error.log"),
      logger = logMessage(error_log_path);

    // nodemon looks for "watch" key in the config object
    config.watch = [source_path];
    config.script = Path.resolve("./encrypt.js");
    // This call to nodemon initialises nodemon within the script

    console.log("Starting encrypt monitor...")
    nodemon(config)
      .on("start", () => {
        GPG = initGPG(email);
      })
      .on("restart", files => {
        encryptFiles(GPG, files, source_path, target_path, logger);
      })
      .on("quit", function() {
        console.log("App has quit");
        process.exit(0);
      });
  }
};
