import * as f from './testFixtures.js';
import * as fs from  'fs';
const assert = require('assert');


// NOTE(rachit): Don't use arrow functions, otherwise timeout doesn't work.
describe('Sanity check -- All tests pass without plugins', function () {
  f.unitTests.forEach(function(filename: string) {
    const prog = fs.readFileSync(filename, 'utf-8').toString();
    it(filename, function () {
      try {
        eval(prog)
        assert(true)
      } catch(e) {
        assert(false, `Sanity check failure: Failed to eval ${filename}`)
      }
    })
  })
})

