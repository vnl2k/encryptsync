// 'use strict';

// const { spawn } = require('child_process');

// describe('Testing Encrypt-Sync starting sequence', function() {
//   it('start the monitor with `--config` option ', function(done) {
//     let proc = spawn('node', ['index.js', '--config', './.encryptsyncrc']);
//     proc.stdout.on('data', message => {
//       let string = message.toString();
//       if (string.search(/To exit press: CTRL/g) > -1) {
//         proc.kill(0);
//         done();
//       }
//     });
//   });

//   // it('should start the monitor with `--target`, `--source` and `--email` options', function(done) {
//   //   let proc = spawn('node', [
//   //     'index.js',
//   //     '--target',
//   //     './tests/target',
//   //     '--source',
//   //     './tests/source',
//   //     '--email',
//   //     'test@example.com'
//   //   ]);
//   //   proc.stdout.on('data', message => {
//   //     let string = message.toString();
//   //     console.log(string)
//   //     // if (string.search(/To exit press: CTRL/g) > -1) {
//   //     //   // proc.kill(0);
//   //     //   // done();
//   //     // }
//   //   });
//   //   proc.on('message', message => console.log(message))
//   //   proc.on('error', message => console.log(message))
//   //   proc.on('close', message => console.log(`close: ${message}`))
//   //   proc.on('disconnect', message => console.log(message))
//   //   proc.stderr.on('error', message => console.log(message))
//   // });

//   // adds 500 ms delay between each test
//   afterEach(function(done) {
//     setTimeout(done, 500);
//   });

//   after(function(done) {
//     setTimeout(() => {
//       done();
//     }, 500);
//   });
// });
