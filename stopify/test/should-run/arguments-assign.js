const assert = require('assert');

let y = 7;

function suspend() { while (false) {} }

function F(x) {
  'use strict';
  arguments[1] = y;
  y = 10;
  suspend();
  assert.equal(arguments[1], 7);
  return x;
}

F(200);
