"use strict";

const assert = require("assert"),
  Path = require("path"),
  fs = require("fs"),
  { encryptFile } = require("../src/encrypt"),
  { GPGencryption } = require("../src/encryptors"),
  { encryptor, extention } = GPGencryption;

const GPGencryptor = encryptor(
  { email: "test@example.com"},
  (err) => console.log(err)
);

const SOURCE_PATH = Path.resolve("./tests/source"),
  TARGET_PATH = Path.resolve("./tests/target"),
  resolver = name => SOURCE_PATH + '/' + name,
  FILES = [resolver("a.txt"), resolver("b.pdf"), resolver("c.txt"), resolver("d.doc"), resolver("new-folder/a.doc")],
  LARGE_FILE = resolver("large-file.txt"),
  MISSING_FILE = resolver("noSuchFile.txt"),
  EXTRA_FILE = resolver('missing-folder/extra-file.md');

const futureEncryptFile = (f) => new Promise(
  (resolve, reject) => encryptFile(
    GPGencryptor,
    extention,
    'gpg',
    SOURCE_PATH,
    TARGET_PATH,
    (path, message) => resolve(path)
  )(f)
);

/*
  KEY GENERATION
    [Generate private key] (https://www.openssl.org/docs/manmaster/man1/genpkey.html)
    ```
      openssl genpkey -algorithm RSA -out securekey.pem -pkeyopt rsa_keygen_bits:1024 -pass pass:XXX
      openssl rsa -in securekey.pem -outform PEM -pubout -out publickey.pem
    ```
    The account password is "test
   */

describe("Testing encryption with GPG", function() {
  it("should fail to encrypt a non-existing file", function(done) {

    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        assert.equal(message.slice(0, 33), "ENOENT: no such file or directory");
        done();
      }
    )(MISSING_FILE);
  });

  it("should encrypt a single file", function(done) {
    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        fs.stat(path, (err, stats) => {
          if (err !== null) assert.fail(err);
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    )(FILES[0]);
  });

  it("should encrypt a single large file", function(done) {
    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        fs.stat(path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    )(LARGE_FILE);
  });

  it("should encrypt two files", function(done) {
    Promise
      .all(FILES.slice(0, 2).map( f => futureEncryptFile(f) ))
      .then( files => {
        assert.equal(files.reduce((a, f) => a + fs.statSync(f).isFile(), 0), 2);
        done();
      })
  });

  it("should encrypt four files", function(done) {
    Promise
      .all(FILES.slice(0, 4).map( f => futureEncryptFile(f) ))
      .then( files => {
        assert.equal(files.reduce((a, f) => a + fs.statSync(f).isFile(), 0), 4);
        done();
      });
  });

  it("should encrypt four files and a large one", function(done) {
    Promise
      .all([LARGE_FILE].concat(FILES.slice(0, 4)).map( f => futureEncryptFile(f) ))
      .then( files => {
        assert.equal(files.reduce((a, f) => a + fs.statSync(f).isFile(), 0), 5);
        done();
      })
      .catch(err => console.log(err));
  });

  it("should encrypt a single file in new-folder", function(done) {
    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        fs.stat(path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    )(FILES[4]);
  });

  it("should encrypt the file name", function(done) {
    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        fs.stat(path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      },
      true
    )(FILES[4]);
  });

  it('should encrypt the extra file in the missing folder', function(done) {
    encryptFile(
      GPGencryptor,
      extention,
      'gpg',
      SOURCE_PATH,
      TARGET_PATH,
      (path, message) => {
        fs.stat(path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    )(EXTRA_FILE);
  });

  after(function(done) {
    fs.readdir('./tests/target', (err, files) => {
      files.map( f => (/\.gpg/).test(f) ? fs.unlinkSync(`./tests/target/${f}`) : fs.rmdirSync(`./tests/target/${f}`, {recursive: true}));
    });

    setTimeout(() => {
      done();
    }, 50);
  });
});
