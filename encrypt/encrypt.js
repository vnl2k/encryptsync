"use strict";

const fs = require("fs"),
  { spawn } = require("child_process"),
  nodemon = require("nodemon"),
  Path = require("path"),
  ERROR_LOG = "error-log.txt";

function logMessage(message) {
  fs.appendFile(
    ERROR_LOG,
    ["[", Date(), "] ", message, "\n"].join(""),
    "utf8",
    err => {
      if (err) throw err;
    }
  );
}

function initGPG(email) {
  let gpg = spawn("gpg", ["-e", "-r", email, "--multifile"]);

  gpg.on("error", err => logMessage(err));
  // .on("close", (code, signal) => {console.log("close event")});

  // gpg.stdout.on("end", () => {
  //   // END event is emitted when gpg is done encrypting the files
  // });

  return gpg;
}

function encryptFiles(gpg, files, source_path, target_path, callback) {
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
            return logMessage(err);
          }

          if (stats !== undefined && stats.isFile()) {
            fs.copyFile(file_name, target_file, err => {
              if (err) {
                callbackCheck(target_file);
                return logMessage(err);
              }

              fs.unlink(file_name, err => {
                if (err) logMessage(err);
                console.log(`moving: ${relative_path}\n`);
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
  monitor: (email, source_path, target_path) => {

    let GPG,
      conf = JSON.parse(fs.readFileSync("./nodemon.json"));

    source_path = Path.resolve(source_path);
    target_path = Path.resolve(target_path);
    conf.watch = [source_path];

    // This call to nodemon initialises nodemon within the script
    nodemon({})
      .on("start", () => {
        GPG = initGPG(email);
      })
      .on("restart", files => {
        encryptFiles(GPG, files, source_path, target_path);
      })
      .on("quit", function() {
        console.log("App has quit");
        process.exit(0);
      });
  }
};
