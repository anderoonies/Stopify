/**
 * This Babel plugin transforms top-level statements to use '$__R.delimit'.
 */
import { NodePath } from 'babel-traverse';
import * as t from 'babel-types';
import * as assert from 'assert';
import * as bh from '../babelHelpers';
import * as fastFreshId from '../fastFreshId';
import * as imm from 'immutable';

const runtime = t.identifier('$__R');

/**
 * Transforms 'stmt' to '$__R.delimit(function delimitN(() { stmt })'
 */
function delimitStmt(stmt: t.Statement): t.Statement {
  const fun = t.functionExpression(fastFreshId.fresh('delimit'), [],
    t.blockStatement([stmt]));
  (<any>fun).localVars = [];
  (<any>fun).boxedArgs = imm.Set.of();

  return t.expressionStatement(t.callExpression(
    t.memberExpression(runtime, t.identifier('delimit')), [fun]));
}

/**
 * Transforms 'e' to '$__R.delimit(function delimitN() { return e; });'
 */
function delimitExpr(e: t.Expression): t.Expression {
  const fun = t.functionExpression(fastFreshId.fresh('delimit'), [],
    t.blockStatement([t.returnStatement(e)]));
  (<any>fun).localVars = [];
  (<any>fun).boxedArgs = imm.Set.of();

  return t.callExpression(
    t.memberExpression(runtime, t.identifier('delimit')), [fun]);
}

const visitor = {
  Program(path: NodePath<t.Program>, state: any): void {
    const body = path.node.body;
    for (let i = 0; i < body.length; i++) {
      const stmt = body[i];
      if (stmt.type === 'VariableDeclaration') {
        assert(stmt.declarations.length === 1);
        const decl = stmt.declarations[0];
        if (decl.init && !bh.isValue(decl.init)) {
          decl.init = delimitExpr(decl.init);
        }
      }
      else if (stmt.type === 'FunctionDeclaration') {
        // leave intact
      }
      else {
        if (state.opts.compileFunction && (<any>body[i]).topFunction) {
        }
        else {
          body[i] = delimitStmt(body[i]);
        }
      }
    }
    path.stop();
  }
};

export default function() {
  return { visitor };
}
