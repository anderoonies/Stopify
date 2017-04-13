// Post-CPS transformation to apply top-level continuation and eval program.

const t = require('babel-types');

const visitor = {};

visitor.Program = function (path) {
  const { body } = path.node;

  const k = path.scope.generateUidIdentifier('k');
  const cpsFunction = body[0].expression;
  const kReturn = t.returnStatement(k);
  const kont = t.functionExpression(null, [k], t.blockStatement([kReturn]));
  const cpsApply = t.callExpression(cpsFunction, [kont]);

  path.node.body = [t.expressionStatement(cpsApply)];
};

module.exports = function transform(babel) {
  return { visitor };
};
