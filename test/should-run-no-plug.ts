import * as f from './testFixtures.js';
import * as path from 'path';
import * as fs from  'fs';
import * as file from 'file';

import * as noEvalVerifier from '../src/verifiers/noEvalVerifier';

// NOTE(rachit): Don't use arrow functions, otherwise timeout doesn't work.
describe('Sanity check -- All tests pass without plugins', function () {
  f.testFiles.forEach(function(filename) {
    const prog = fs.readFileSync(filename, 'utf-8').toString();
    it(filename, function () {
      this.timeout(1000)
      f.retainValueTest(prog, [ [noEvalVerifier] ])
    })
  })
})
