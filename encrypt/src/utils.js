"use strict";

const Fs = require("fs"),
  FsPromise = require("fs").promises;

function deleteGPGFiles(files) {

  Promise.all(
    files.map( f => FsPromise.unlink(f))
  )  
    .then(() => console.log(files))
    .catch((err) => console.log(err));

}

const logMessage = (log_path, toConsole=true) => message => {
  if (toConsole === true) console.log(["[", (new Date()).toLocaleTimeString(), "] ", message, "\n"].join(""));

  Fs.appendFile(log_path, ["[", Date(), "] ", message, "\n"].join(""), "utf8", err => {
    if (err) throw err;
  });

};

module.exports = {
  deleteGPGFiles,
  logMessage
};
