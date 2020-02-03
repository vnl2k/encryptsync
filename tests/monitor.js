'use strict';

const Assert = require('assert'),
  Path = require('path'),
  Fs = require('fs'),
  Fsp = Fs.promises,
  Stream = require('stream'),
  { monitor } = require('../src/encrypt');

const SOURCE_PATH = Path.resolve('./tests/source'),
  SOURCE_FILE = Path.join(SOURCE_PATH, '/new_file.txt'),
  NEW_FOLDER = Path.join(SOURCE_PATH, '/new_FOLDEr'),
  NEW_TARGET_FOLDER = Path.resolve(Path.join('./tests/target', '/new_FOLDEr')),
  TARGET_FILE = Path.resolve('./tests/target/new_file.txt.gpg');

// https://nodejs.org/api/stream.html#stream_implementing_a_writable_stream
let queue = new Stream.Duplex({
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

let encryptFileStub = () => file => {
  queue.write(file);
  Fs.writeFileSync(TARGET_FILE, 'test: create file\n');

  return Promise.resolve('dummy path');
};

// initialize the monitor
monitor('./.encryptsyncrc', encryptFileStub);

describe('Testing encryption with GPG', function() {
  it('should encrypt a new file', function(done) {
    Fs.writeFileSync(SOURCE_FILE, 'test: create file\n');

    setTimeout(() => {
      Assert.equal(Fs.existsSync(queue.read()), true);
      done();
    }, 10);
  });

  it('should encrypt an updated file', function(done) {
    Fs.writeFileSync(SOURCE_FILE, 'test: update file\n', { flag: 'a' });

    setTimeout(() => {
      Assert.equal(queue.read(), SOURCE_FILE);
      done();
    }, 10);
  });

  it('should sync a new folder', function(done) {
    Fsp.mkdir(NEW_FOLDER)
      .then(new Promise((resolve) => setTimeout(() => resolve(), 150)))
      .then(() => Fsp.stat(NEW_TARGET_FOLDER))
      .then(stats => {
        Assert.equal(stats.isDirectory(), true);
        done();
      })
      .catch(err => {
        console.log(err);
        Assert.equal(err.errno, -2);
        done();
      });
  });

  it('should sync a deleted file', function(done) {
    Fs.unlinkSync(SOURCE_FILE);

    setTimeout(() => {
      try {
        Fs.statSync(TARGET_FILE);
      } catch (err) {
        Assert.equal(err.errno, -2);
      }
      done();
    }, 120);
  });

  it('should sync a deleted (empty in this case) folder', function(done) {
    Fsp.rmdir(NEW_FOLDER)
      .then(new Promise(resolve => setTimeout(() => resolve(), 140)))
      .then(() => Fsp.stat(NEW_TARGET_FOLDER))
      .then(stats => console.log(stats))
      .catch(err => {
        console.log(err)
        Assert.equal(err.errno, -2);
        done();
      });
  });

  // adds 200 ms delay between each test
  afterEach(done => setTimeout(done, 200));

  after(done => {
    setTimeout(() => {
      done();
      process.exit(0);
    }, 150);
  });
});
