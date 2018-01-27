import * as babel from 'babel-core';
export { plugin } from './stopify/stopifyCallCC';
import *  as types from './types';
import { compileFunction } from './stopify/compileFunction'
export { compileFunction } from './stopify/compileFunction'
import * as smc from 'convert-source-map';
import { generateLineMapping, LineMapping } from './sourceMaps';
import { SourceMapConsumer, RawSourceMap } from 'source-map';
import { plugin as stopifyCallCC } from './stopify/stopifyCallCC';
import * as fs from 'fs-extra';
export { CompilerOpts } from './types';
import { pack }from 'stopify-continuations';
import * as tmp from 'tmp';

function mustWebPack(opts: types.CompilerOpts): boolean {
  return !opts.noWebpack && (opts.es === 'es5' || opts.hofs === 'fill');
}

function stopifyPack(srcPath: string, opts: types.CompilerOpts): Promise<string> {
  return new Promise((resolve, reject) => {
    const dstPath = tmp.fileSync({ postfix: '.js' }).name;
    pack(srcPath, dstPath, [stopifyCallCC, opts], err => {
      if (err !== null) {
        fs.removeSync(dstPath);
        return reject(err);
      }
      const jsCode = fs.readFileSync(dstPath, 'utf-8');
      fs.removeSync(dstPath);
      return resolve(jsCode);
    });
  });
}

export function stopifySourceSync(src: string, opts: types.CompilerOpts): string {
  const babelOpts = {
    plugins: [[ stopifyCallCC, opts ]],
    babelrc: false,
    ast: false,
    code: true,
    minified: true,
    comments: false,
  };

  const { ast, code, map } = babel.transform(src, babelOpts);
  return code!;
}

export function stopifySource(src: string, opts: types.CompilerOpts): Promise<string> {
  return new Promise((resolve, reject) =>
    resolve(stopifySourceSync(src, opts)));
}

export function stopify(srcPath: string, opts: types.CompilerOpts): Promise<string> {

  if (opts.captureMethod === 'original') {
    return fs.readFile(srcPath, 'utf-8');
  }
  mustWebPack(opts);
  if (mustWebPack(opts)) {
    return stopifyPack(srcPath, opts);
  }

  return fs.readFile(srcPath, 'utf-8')
    .then(src => {
      if (!opts.debug) {
        return { src: src, sourceMap: undefined };
      }
      const mapConverter = smc.fromSource(src)!;
      const map = mapConverter ? mapConverter.toObject() : null;
      return { src: src, sourceMap: generateLineMapping(<RawSourceMap>map) };
    })
    .then(({src, sourceMap}) =>
      stopifySource(src, opts));
}

export function stopifyEvalCode(code: string, renames: { [key: string]: string }, boxes: string[]): string {

  const transformed = compileFunction(code, <any>{
    debug: false,
    captureMethod: 'lazy',
    newMethod: 'wrapper',
    eval: false,
    es: 'sane',
    hofs: 'builtin',
    jsArgs: 'simple',
    requireRuntime: true,
    noWebpack: true,
    renames,
    boxes
  });
  return transformed!;
}
