"use strict";

// Run the ahole app:
// npm run monitor test@example.com ./tests/source ./tests/target

const assert = require("assert"),
  Path = require("path"),
  fs = require("fs"),
  { encryptFiles } = require("../encrypt.js");

const SOURCE_PATH = Path.resolve("./tests/source"),
  TARGET_PATH = Path.resolve("./tests/target"),
  resolver = name => Path.resolve("./tests/source/" + name),
  FILES = [
    resolver("a.txt"),
    resolver("b.pdf"),
    resolver("c.txt"),
    resolver("d.doc"),
    resolver("new-folder/a.doc")
  ];
/*
  KEY GENERATION
    # generate private key
    # https://www.openssl.org/docs/manmaster/man1/genpkey.html
    openssl genpkey -algorithm RSA -out securekey.pem -pkeyopt rsa_keygen_bits:1024 -pass pass:XXX
    openssl rsa -in securekey.pem -outform PEM -pubout -out publickey.pem
   */

// The account password is "test

const RSAencryptor = () => ({ public_key: "./tests/publickey.pem" });

describe("Testing encryption with RSA", function() {
  it("should encrypt a single file", function(done) {
    encryptFiles(
      FILES.slice(0, 1),
      RSAencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        fs.stat(encrypted_files[0], (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt two files", function(done) {
    encryptFiles(
      FILES.slice(0, 2),
      RSAencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        assert.equal(
          encrypted_files.reduce((a, f) => a + fs.statSync(f).isFile(), 0),
          2
        );
        done();
      }
    );
  });

  it("should encrypt four files", function(done) {
    encryptFiles(
      FILES.slice(0, 4),
      RSAencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        assert.equal(
          encrypted_files.reduce((a, f) => a + fs.statSync(f).isFile(), 0),
          4
        );
        done();
      }
    );
  });

  it("should encrypt a single file in new-folder", function(done) {
    encryptFiles(
      FILES.slice(4),
      RSAencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        fs.stat(encrypted_files[0], (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt a single file in new-folder AND encrypt the file name", function(done) {
    encryptFiles(
      FILES.slice(4),
      RSAencryptor(),
      SOURCE_PATH,
      TARGET_PATH,
      message => {},
      encrypted_files => {
        fs.stat(encrypted_files[0], (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      },
      true
    );
  });
});
