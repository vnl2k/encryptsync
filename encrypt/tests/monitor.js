"use strict";

const Assert = require("assert"),
  Path = require("path"),
  Fs = require("fs"),
  Stream = require('stream'),
  { monitor } = require("../encrypt.js");


const SOURCE_PATH = Path.resolve("./tests/source"),
  TARGET_FILE = Path.join(SOURCE_PATH, "/new_file.txt");

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

let encryptFilesStub = (
  files,
  encryptor_options,
  source_path,
  target_path,
  errLogger,
  callback,
  scrambleNames=false
) => {
  queue.write(files);
};


// initialize the monitor
monitor("./config.json", encryptFilesStub);

describe("Testing encryption with GPG", function() {
  it("should encrypt a new file", function(done) {

    Fs.writeFileSync(TARGET_FILE, "test: create file\n");

    setTimeout(() => {
      Assert.equal(Fs.existsSync(queue.read()[0]), true);
      done();
    }, 10);
  });

  it("should encrypt an updated file", function(done) {
    Fs.writeFileSync(TARGET_FILE, "test: update file\n", {flag: 'a'});

    setTimeout(() => {
      Assert.equal(queue.read()[0], TARGET_FILE);
      done();
    }, 10);
   
  });

  it("should sync a deleted file", function(done) {
    Fs.unlinkSync(TARGET_FILE);

    setTimeout(() => {
      Assert.equal(queue.read()[0], TARGET_FILE);
      done();
    }, 10);
   
  });

  // adds 50 ms delay between each test
  afterEach((done) => setTimeout(done, 50));

  after(() => {
    process.exit(0);
  });
});
