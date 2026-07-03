import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { readSource } from "./lib/read-source.mjs";

const sourceRoots = ["src/app", "src/components"];

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.(tsx?|jsx?)$/.test(entry) ? [fullPath] : [];
  });
}

const sourceFiles = sourceRoots.flatMap(listSourceFiles);
const guardFailures = [];

function getScriptKind(filePath) {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }

  if (filePath.endsWith(".js")) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.TS;
}

function getLocation(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );

  return `${sourceFile.fileName}:${position.line + 1}:${position.character + 1}`;
}

function findAncestor(node, predicate) {
  let current = node.parent;

  while (current) {
    if (predicate(current)) {
      return current;
    }

    current = current.parent;
  }

  return undefined;
}

function isConstDeclaration(statement) {
  return (
    ts.isVariableStatement(statement) &&
    (statement.declarationList.flags & ts.NodeFlags.Const) !== 0
  );
}

function isNegatedWroteDraft(expression) {
  if (ts.isParenthesizedExpression(expression)) {
    return isNegatedWroteDraft(expression.expression);
  }

  return (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.ExclamationToken &&
    ts.isIdentifier(expression.operand) &&
    expression.operand.text === "wroteDraft"
  );
}

function branchReturnsDirectly(statement) {
  if (ts.isReturnStatement(statement)) {
    return true;
  }

  if (!ts.isBlock(statement)) {
    return false;
  }

  return statement.statements.some(ts.isReturnStatement);
}

function verifyWriteStudioDraftCall(sourceFile, callExpression) {
  const callLocation = getLocation(sourceFile, callExpression);
  const variableDeclaration = findAncestor(callExpression, ts.isVariableDeclaration);
  const variableStatement = findAncestor(callExpression, ts.isVariableStatement);

  if (
    !variableDeclaration ||
    variableDeclaration.initializer !== callExpression ||
    !ts.isIdentifier(variableDeclaration.name) ||
    variableDeclaration.name.text !== "wroteDraft" ||
    !variableStatement ||
    !isConstDeclaration(variableStatement)
  ) {
    guardFailures.push(
      `${callLocation} should assign writeStudioDraft to const wroteDraft`,
    );
    return;
  }

  const parentBlock = variableStatement.parent;

  if (!ts.isBlock(parentBlock)) {
    guardFailures.push(
      `${callLocation} should live inside a block with a matching fallback guard`,
    );
    return;
  }

  const statementIndex = parentBlock.statements.findIndex(
    (statement) => statement === variableStatement,
  );
  const fallbackGuard = parentBlock.statements[statementIndex + 1];

  if (
    !fallbackGuard ||
    !ts.isIfStatement(fallbackGuard) ||
    !isNegatedWroteDraft(fallbackGuard.expression)
  ) {
    guardFailures.push(
      `${callLocation} should be followed immediately by if (!wroteDraft)`,
    );
    return;
  }

  if (!branchReturnsDirectly(fallbackGuard.thenStatement)) {
    guardFailures.push(
      `${getLocation(
        sourceFile,
        fallbackGuard,
      )} should directly return from the manual fallback branch before navigation`,
    );
  }
}

function verifySourceFile(filePath) {
  const source = readSource(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );
  let callCount = 0;

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "writeStudioDraft"
    ) {
      callCount += 1;
      verifyWriteStudioDraftCall(sourceFile, node);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return callCount;
}

const draftCallCount = sourceFiles.reduce(
  (count, filePath) => count + verifySourceFile(filePath),
  0,
);

assert.ok(draftCallCount > 0, "Expected at least one Studio draft write call");
assert.deepEqual(
  guardFailures,
  [],
  `Every writeStudioDraft call should save to const wroteDraft and directly return from its fallback guard:\n${guardFailures.join(
    "\n",
  )}`,
);

console.log(
  `Studio draft fallback guard verification passed for ${draftCallCount} draft writes.`,
);
