"use strinct";

const  { spawn } = require("child_process"),
  Fs = require("fs"),
  Crypto = require("crypto");


function RSAencryption({public_key}, errLogger) {
  const publicKey = Fs.readFileSync(public_key, "utf8");

  return function(file, callback) {
    callback(Crypto.publicEncrypt(publicKey, Fs.readFileSync(file)));
  };
}

function GPGencryption({email}, errLogger) {
  return function(sourceFile, callback) {
    // trust-model = auto: Skip  key  validation  and  assume that used keys are always fully trusted.
    let gpg = spawn("gpg", ["-e", "-r", email, "--trust-model", "always", "--output", "-", sourceFile]);

    gpg.stderr.on("message", message => errLogger(`GPG std error: ${message}`));
    gpg.on("error", message => errLogger(`GPG error: ${message}`));

    callback(gpg.stdin, gpg.stdout);
  };
}

module.exports = {
  RSAencryption: {
    encryptor: RSAencryption,
    extention: '.rsa'
  },
  GPGencryption: {
    encryptor: GPGencryption,
    extention: '.gpg'
  }
};
