'use strinct';

const { spawn } = require('child_process'),
  Fs = require('fs'),
  Crypto = require('crypto');

// NOT IN USE ATM
function RSAencryption({ public_key }) {
  const publicKey = Fs.readFileSync(public_key, 'utf8');

  return function(file, callback) {
    callback(Crypto.publicEncrypt(publicKey, Fs.readFileSync(file)));
  };
}

function GPGencryption({ email }) {
  return sourceFile =>
    new Promise(resolve => {
      // trust-model = auto: Skip  key  validation  and  assume that used keys are always fully trusted.
      resolve(
        spawn('gpg', ['-e', '-r', email, '--trust-model', 'always', '--output', '-', sourceFile])
      );
    });
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
