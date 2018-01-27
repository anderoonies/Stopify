/**
 * This transformation boxes certain assignable variables to preserve
 * reference equality when the stack is reconstructed.
 *
 * Preconditions:
 * 1. The freeIds pass has been applied.
 */
import * as t from 'babel-types';
import * as babel from 'babel-core';
import { NodePath, Visitor } from 'babel-traverse';

const visitor = {
  Program() {
    this.renames = [];
    this.boxed = [];
  },

  Scope: {
    enter(path: NodePath<t.Scopable>): void {
      this.renames.push((<any>path.node).renames);
      this.boxed.push((<any>path.node).boxed);
    },
    exit(path: NodePath<t.Scopable>): void {
      this.renames.pop();
      this.boxed.pop();
    },
  },

  CallExpression: function(path: NodePath<t.CallExpression>): void {
    if (t.isIdentifier(path.node.callee) &&
      path.node.callee.name === 'eval') {

      // Construct rename object.
      const renames: { [key: string]: string } = {};
      this.renames.forEach((map: { [key: string]: string }) => {
        for (const x in map) {
          renames[x] = map[x];
        }
      });
      let props = [];
      for (const x in renames) {
        props.push(t.objectProperty(t.stringLiteral(x), t.stringLiteral(renames[x])));
      }

      // Construct boxed array.
      const vars = new Set();
      this.boxed.filter((x: any) => !!x).forEach((set: Set<string>) =>
          set.forEach(x => vars.add(x)));

      path.node.arguments = [t.callExpression(t.memberExpression(t.identifier("$__C"), t.identifier("stopifyEvalCode")),
        [...path.node.arguments, t.objectExpression(props), t.arrayExpression(Array.from(vars).map(x => t.stringLiteral(x)))])];
    }
  }
}

export function plugin() {
  return { visitor };
}

function main() {
  const filename = process.argv[2];
  const opts = { plugins: [() => ({ visitor })], babelrc: false };
  babel.transformFile(filename, opts, (err, result) => {
    if (err !== null) {
      throw err;
    }
    console.log(result.code);
  });
}

if (require.main === module) {
  main();
}
