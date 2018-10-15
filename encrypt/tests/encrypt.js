"use strict";

// Run the ahole app:
// npm run monitor test@example.com ./tests/source ./tests/target


const assert = require("assert"),
  Path = require("path"),
  fs = require("fs"),
  { encryptFiles, initGPG, logMessage } = require("../encrypt.js");

const SUORCE_PATH = Path.resolve("./tests/source"),
  TARGET_PATH = Path.resolve("./tests/target"),
  resolver = name => Path.resolve("./tests/source/" + name),
  FILES = [
    resolver("a.txt"),
    resolver("b.pdf"),
    resolver("c.txt"),
    resolver("d.doc"),
    resolver("new-folder/a.doc")
  ];

// The account password is "test

describe("Testing sync-app", function() {
  it("should encrypt a single file", function(done) {
    let gpg = initGPG("test@example.com");

    encryptFiles(
      gpg,
      FILES.slice(0, 1),
      SUORCE_PATH,
      TARGET_PATH,
      (message) => {},
      encrypted_files => {
        fs.stat(encrypted_files[0], (err, stats) => {
          if (stats !== undefined) assert.equal(stats.isFile(), true);
          done();
        });
      }
    );
  });

  it("should encrypt two files", function(done) {
    let gpg = initGPG("test@example.com");

    encryptFiles(
      gpg,
      FILES.slice(0, 2),
      SUORCE_PATH,
      TARGET_PATH,
      (message) => {},
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
    let gpg = initGPG("test@example.com");

    encryptFiles(
      gpg,
      FILES.slice(0, 4),
      SUORCE_PATH,
      TARGET_PATH,
      (message) => {},
      encrypted_files => {
        assert.equal(
          encrypted_files.reduce((a, f) => a + fs.statSync(f).isFile(), 0),
          4
        );
        done();
      }
    );
  });

  // it("should encrypt a single file in new-folder", function(done) {
  //   let gpg = initGPG("test@example.com");

  //   encryptFiles(
  //     gpg,
  //     FILES.slice(4),
  //     SUORCE_PATH,
  //     TARGET_PATH,
        // (message) => {},
  //     encrypted_files => {
  //       fs.stat(encrypted_files[0], (err, stats) => {
  //         if (stats !== undefined) assert.equal(stats.isFile(), true);
  //         done();
  //       });
  //     }
  //   );
  // });
});
