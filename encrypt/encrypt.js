"use strict";

const fs = require("fs"),
  { spawn } = require("child_process"),
  nodemon = require("nodemon"),
  EMAIL = process.argv[2],
  DESTINATION_PATH = process.argv[3] || process.env.HOME + "/Dropbox",
  CWD = process.cwd()

const ERROR_LOG = "error-log.txt";

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

if (EMAIL == undefined) {
  console.log(
    "Please provide recepient email, e.g.\n npm run monitor john.smith@mail.com"
  );
  process.exit();
}

// This call to nodemon initialises nodemon within the script
nodemon({});

var FILES = [],
  gpg;

process.on("SIGUSR2", function() {
  // gracefulShutdown(function () {
  //   process.kill(process.pid, 'SIGUSR2');
  // });
});

nodemon
  .on("start", function() {
    if (gpg === undefined || gpg.signalCode === "SIGUSR2") {
      gpg = spawn("gpg", ["-e", "-r", EMAIL, "--multifile"]);
      gpg
        .on("error", err => {
          logMessage(err);
        })
        .on("close", (code, signal) => {})
        .on("exit", (code, signal) => {
          if (FILES !== undefined && FILES.length > 0)
            FILES.forEach(f => {
              let file_name = f + ".gpg";
              let target_file = file_name.replace(CWD, DESTINATION_PATH);
              let relative_path = file_name.replace(CWD, "");

              fs.stat(file_name, (err, stats) => {
                if (err) return logMessage(err);
                if (stats !== undefined && stats.isFile()) {
                  fs.copyFile(file_name, target_file, err => {
                    if (err) return logMessage(err);

                    fs.unlink(file_name, err => {
                      if (err) logMessage(err);
                      console.log(`moving: ${relative_path}\n`);
                    });
                  });
                }
              });
            });
        });

      gpg.stdout.on("end", () => {
        // END event is emitted when gpg is done encrypting the files
      });
    }

    FILES = [];
  })
  .on("restart", files => {
    FILES = files || [];

    gpg.stdin.write(files.map(f => f + "\n").join(""));
  })
  .on("quit", function() {
    console.log("App has quit");
    process.exit();
  });
