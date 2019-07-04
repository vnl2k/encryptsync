"use strict";

const Assert = require("assert"),
  Path = require("path"),
  Fs = require("fs"),
  Stream = require('stream'),
  { monitor } = require("../encrypt.js");


const SOURCE_PATH = Path.resolve("./tests/source");
  // TARGET_PATH = Path.resolve("./tests/target"),
  // resolver = name => Path.resolve("./tests/source/" + name),
  // FILES = [resolver("a.txt"), resolver("b.pdf"), resolver("c.txt"), resolver("d.doc"), resolver("new-folder/a.doc")],
  // LARGE_FILE = resolver("large-file.txt"),
  // MISSING_FILE = resolver("noSuchFile.txt");

// https://nodejs.org/api/stream.html#stream_implementing_a_writable_stream
let queue  = new Stream.Duplex({
  decodeStrings: true,
  readableObjectMode: true,
  writableObjectMode: true,

  read() {
    // ...
  },

  write(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }
});

let encryptFilesStub = (files, encryptor_options, source_path, target_path, errLogger, callback, scrambleNames=false) => {
  queue.write(files);
};


// initialize the monitor
monitor("./config.json", encryptFilesStub);

describe("Testing encryption with GPG", function() {
  it("should encrypt a new file", function(done) {

    Fs.writeFileSync(Path.join(SOURCE_PATH, "/new_file.txt"), "test");

    setTimeout(() => {
      let chunk = queue.read();
      console.log(chunk);

      Assert.equal(1,1);
      done();
      process.exit(0);
    }, 10);
   

  });
});
