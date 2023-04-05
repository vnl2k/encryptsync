var path = require('path');

// the solution to the fsevents error message is from: https://github.com/paulmillr/chokidar/issues/828#issuecomment-854474603
const { IgnorePlugin } = require('webpack');

const optionalPlugins = [];
if (process.platform !== 'darwin') {
  optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}

module.exports = {
  entry: './dist/index.js',
  target: 'node',
  mode: 'production',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js'
  },
  plugins: [...optionalPlugins],
  externals: {
    // declares sqlite3 as external module and stops webpack from trying to bundle it in
    sqlite3: 'sqlite3'
  }
};
