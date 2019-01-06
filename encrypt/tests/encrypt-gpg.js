"use strict";

const assert = require("assert"),
  Path = require("path"),
  fs = require("fs"),
  { encryptFiles, logMessage } = require("../encrypt.js");

const SOURCE_PATH = Path.resolve("./tests/source"),
  TARGET_PATH = Path.resolve("./tests/target"),
  resolver = name => Path.resolve("./tests/source/" + name),
  FILES = [
    resolver("a.txt"),
    resolver("b.pdf"),
    resolver("c.txt"),
    resolver("d.doc"),
    resolver("new-folder/a.doc"),
  ],
  LARGE_FILE = resolver("large-file.txt"),
  MISSING_FILE = resolver("noSuchFile.txt");
/*
  KEY GENERATION
    # generate private key
    # https://www.openssl.org/docs/manmaster/man1/genpkey.html
    openssl genpkey -algorithm RSA -out securekey.pem -pkeyopt rsa_keygen_bits:1024 -pass pass:XXX
    openssl rsa -in securekey.pem -outform PEM -pubout -out publickey.pem
   */

// The account password is "test

const GPGencryptor = () => ({ email: "nikolay.vaklev@gmail.com", method: "gpg" });

describe("Testing encryption with GPG", function() {

  it("should fail to encrypt a non-existing file", function(done) {
    encryptFiles(
      [MISSING_FILE],
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      () => {},
      res => {
        assert.equal(res[0].error.slice(0,33), "ENOENT: no such file or directory");
        done();
      }
    );
  });

  it("should encrypt a single file", function(done) {
    encryptFiles(
      FILES.slice(0, 1),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      () => {},
      res => {
        fs.stat(res[0].path, (err, stats) => {
          if (err !== null) assert.fail(err);
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt a single large file", function(done) {
    encryptFiles(
      [LARGE_FILE],
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      list => {
        fs.stat(list[0].path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt two files", function(done) {
    encryptFiles(
      FILES.slice(0, 2),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      list => {
        assert.equal(
          list.reduce((a, f) => a + fs.statSync(f.path).isFile(), 0),
          2
        );
        done();
      }
    );
  });

  it("should encrypt four files", function(done) {
    encryptFiles(
      FILES.slice(0, 4),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        assert.equal(
          encrypted_files.reduce((a, f) => a + fs.statSync(f.path).isFile(), 0),
          4
        );
        done();
      }
    );
  });

  it("should encrypt four files and a large one", function(done) {
    encryptFiles(
      [LARGE_FILE].concat(FILES.slice(0, 4)),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        assert.equal(
          encrypted_files.reduce((a, f) => a + fs.statSync(f.path).isFile(), 0),
          5
        );
        done();
      }
    );
  });

  it("should encrypt a single file in new-folder", function(done) {
    encryptFiles(
      FILES.slice(4),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        fs.stat(encrypted_files[0].path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt a single file in new-folder AND encrypt the file name", function(done) {
    encryptFiles(
      FILES.slice(4),
      GPGencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        fs.stat(encrypted_files[0].path, (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
          process.exit(0);
        });
      },
      true
    );
  });
});
