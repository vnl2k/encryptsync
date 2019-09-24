"use strinct";

const  { spawn } = require("child_process"),
  Fs = require("fs"),
  Crypto = require("crypto");


function RSAencryption(options) {
  const publicKey = Fs.readFileSync(options.public_key, "utf8");

  return function(file, callback) {
    callback(Crypto.publicEncrypt(publicKey, Fs.readFileSync(file)));
  };
}

function GPGencryption(options, errLogger) {
  return function(file_name, callback) {
    // trust-model = auto: Skip  key  validation  and  assume that used keys are always fully trusted.
    let gpg = spawn("gpg", ["-e", "-r", options.email, "--trust-model", "always", "--output", "-", file_name]);

    gpg.stderr.on("message", message => errLogger(`GPG std error: ${message}`));
    gpg.on("error", message => errLogger(`GPG error: ${message}`));

    callback(gpg.stdin, gpg.stdout);
  };
}

module.exports = {
  RSAencryption,
  GPGencryption 
};