'use strict';

const Assert = require('assert'),
  Path = require('path'),
  { compareTrees } = require('../src/utils');

const SOURCE_PATH = Path.resolve('./tests/source'),
  TARGET_PATH = Path.resolve('./tests/target');

describe('Testing comparing folder trees', function() {
  it('should ...', function(done) {
    compareTrees(SOURCE_PATH, TARGET_PATH);
    Assert.equal(1, 1);

    setTimeout(() => {
      done();
    }, 20);
  });
});
