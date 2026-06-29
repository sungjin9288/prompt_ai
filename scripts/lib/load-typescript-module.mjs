import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const moduleCache = new Map();

function resolveModuleFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    resolve(basePath, "index.ts"),
    resolve(basePath, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  throw new Error(`Unable to resolve TypeScript module: ${basePath}`);
}

function resolveTypescriptModule(request, parentPath) {
  if (request.startsWith("@/")) {
    return resolveModuleFile(resolve("src", request.slice(2)));
  }

  if (request.startsWith(".")) {
    return resolveModuleFile(resolve(dirname(parentPath), request));
  }

  throw new Error(`Unsupported module import in verification loader: ${request}`);
}

function loadTypescriptModuleByPath(sourcePath) {
  if (moduleCache.has(sourcePath)) {
    return moduleCache.get(sourcePath);
  }

  const source = readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const exportsObject = {};
  const context = {
    exports: exportsObject,
    module: { exports: exportsObject },
    process,
    require: (request) =>
      loadTypescriptModuleByPath(resolveTypescriptModule(request, sourcePath)),
  };

  moduleCache.set(sourcePath, context.module.exports);

  vm.runInNewContext(compiled.outputText, context, {
    filename: sourcePath,
  });

  return context.module.exports;
}

export function loadTypescriptModule(sourceFile) {
  return loadTypescriptModuleByPath(resolve(sourceFile));
}
