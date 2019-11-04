"use strict";

const Crypto = require("crypto"),
  Path = require("path"),
  Fs = require("fs"),
  FsPromise = require("fs").promises;
  // { RSAencryption } = require('./encryptors');

function deleteGPGFiles(files) {

  Promise.all(
    files.map( f => FsPromise.unlink(f))
  )  
    .then(() => console.log(files))
    .catch((err) => console.log(err));

}

const logMessage = (log_path, tags, toConsole=true) => message => {
  let fullMessage = `[${(new Date()).toLocaleTimeString()}] [${tags}] ${message}`;

  if (toConsole === true) console.log(fullMessage);

  Fs.appendFile(log_path, fullMessage + "\n", "utf8", err => {
    if (err) throw err;
  });

};

const sha256Name = (file) => {
  const fileName = Path.basename(file),
    sha256 = Crypto.createHash("sha256");

  sha256.update(fileName);
  return sha256.digest("hex");
};

// const RSAencryptor = RSAencryption.encryptor();

// const RSAName = (file) => {

// };

module.exports = {
  deleteGPGFiles,
  logMessage,
  sha256Name,
  // RSAName
};
