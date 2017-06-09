import {
  yieldStopify, yieldStopifyPrint
} from './stopifyStandaloneImpl/stopifyYield'
import { StopWrapper } from './helpers'
import * as fs from 'fs'
import * as path from 'path'

function showUsage() {
  console.log('Usage: stopify.js -i <filename> -t [cps|tcps|yield|regen] [options]');
  console.log('       stopify.js -s <string> -t [cps|tcps|yield|regen] [options]\n');
  console.log('Options:')
  console.log('  -y, --interval     Set yield interval')
  console.log('  -o, --output       Can be print, eval, benchmark')
  process.exit(0);
}

const argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) {
  showUsage();
}
let code;
if (argv.s) {
  code = argv.s;
} else if (argv.file || argv.i) {
  const filename = argv.file || argv.i
  code = fs.readFileSync(
    path.join(process.cwd(), filename), 'utf-8').toString()
} else {
  console.log('No input')
  showUsage();
}

const transform = argv.transform || argv.t
const output = argv.output || argv.o || 'print';

if (transform === undefined) {
  console.log('No transformation was specified')
  showUsage();
}


let interval = argv.y || argv.yieldInterval
if (interval !== undefined) {
  let interval = parseInt(argv.y || argv.yieldInterval)
  if (isNaN(interval)) {
    console.log(`// Unknown interval: ${interval}, using 10.`)
    interval = 10;
  }
}

function timeInSecs(time: number[]): string {
  return `${time[0] + time[1] * 1e-9}`
}

switch(output) {
  case 'print': {
    let stopifyFunc;
    switch(transform) {
      case 'yield':
        stopifyFunc = yieldStopifyPrint
        break;
      default:
        throw new Error(`Unknown transform: ${transform}`)
    }
    let time = "";
    let prog;
    if (process) {
      const stime = process.hrtime()
      prog = stopifyFunc(code)
      time = timeInSecs(process.hrtime(stime))
    } else {
      prog = stopifyFunc(code)
    }
    console.log(prog)
    console.log(`// Compilation time: ${time}s`)
    break;
  }
  case 'eval': {
    let stopifyFunc;
    switch(transform) {
      case 'yield':
        stopifyFunc = yieldStopify
        break;
      default:
        throw new Error(`Unknown transform: ${transform}`)
    }
    let ctime = "";
    let prog;
    if (process) {
      const stime = process.hrtime()
      prog = stopifyFunc(code)
      ctime = timeInSecs(process.hrtime(stime))
      console.log(`// Compilation time: ${ctime}`)
    } else {
      prog = stopifyFunc(code)
    }
    const sw: StopWrapper = new StopWrapper();
    let rtime = "";
    if (process) {
      const stime = process.hrtime()
      prog(sw.isStop, sw.onStop, () => {}, interval)
      const rtime = process.hrtime(stime)
      console.log(`// Runtime : ${timeInSecs(rtime)}`)
    }
    break;
  }
  default:
    break;
}