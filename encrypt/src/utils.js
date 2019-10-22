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

const logMessage = (log_path, tags, toConsole=true) => message => {
  let fullMessage = `[${(new Date()).toLocaleTimeString()}] [${tags}] ${message}\n`;

  if (toConsole === true) console.log(fullMessage);

  Fs.appendFile(log_path, fullMessage, "utf8", err => {
    if (err) throw err;
  });

};

module.exports = {
  deleteGPGFiles,
  logMessage
};
