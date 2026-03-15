#!/usr/bin/env bun
export {};
/**
 * Eden Type Generator v3 — AST-powered, auto-inferring
 *
 * Features:
 *   - TypeScript Compiler API for return type + body + query inference
 *   - Named interfaces (clean, reusable)
 *   - Path params (:id) support
 *   - Query params (@Query) support
 *   - --watch mode for auto-regeneration
 *
 * Usage:
 *   bun run eden:generate <module> --output <path>
 *   bun run eden:generate <module> --output <path> --watch
 */
import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import 'reflect-metadata';
import { CONTROLLER_WATERMARK, PATH_METADATA, METHOD_METADATA, MODULE_METADATA, ROUTE_ARGS_METADATA } from '../src/constants';
import { RequestMethod } from '../src/decorators/method.decorator';
import { SSE_METADATA } from '../src/decorators/sse.decorator';
import { RouteParamtypes } from '../src/decorators/param.decorator';
import type { Type } from '../src/di/provider';

// ─── CLI ─────────────────────────────────────────────────────────

const cliArgs = process.argv.slice(2);
const modulePath = cliArgs.find(a => !a.startsWith('--'));
const outputIdx = cliArgs.indexOf('--output');
const outputPath = outputIdx !== -1 ? cliArgs[outputIdx + 1] : undefined;
const watchMode = cliArgs.includes('--watch');

if (!modulePath) {
  console.error(`
  Eden Type Generator v3

  Usage:
    bun run eden:generate <module-path> --output <output-path> [--watch]

  Example:
    bun run eden:generate src/app.module.ts --output src/eden.ts
    bun run eden:generate src/app.module.ts --output src/eden.ts --watch
  `);
  process.exit(1);
}

// ─── Core Generation ─────────────────────────────────────────────

async function generate() {
  const startTime = Date.now();

  // Step 1: Import module + extract controllers
  // Clear require cache for watch mode
  delete require.cache[Bun.resolveSync('./' + modulePath!, process.cwd())];

  const moduleFile = await import(Bun.resolveSync('./' + modulePath!, process.cwd()));
  const AppModule = moduleFile.AppModule || moduleFile.default || Object.values(moduleFile)[0];

  if (!AppModule) {
    console.error(`❌ Could not find AppModule in ${modulePath}`);
    return;
  }

  const controllers: Type<unknown>[] = [];
  const resolved = new Set<unknown>();

  function walk(mod: any) {
    if (mod && typeof mod === 'object' && 'module' in mod) {
      if (resolved.has(mod.module)) return;
      resolved.add(mod.module);
      if (mod.controllers) controllers.push(...mod.controllers);
      for (const imp of (mod.imports || [])) walk(imp);
      walk(mod.module);
      return;
    }
    if (resolved.has(mod)) return;
    resolved.add(mod);
    controllers.push(...(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, mod) || []));
    for (const imp of (Reflect.getMetadata(MODULE_METADATA.IMPORTS, mod) || [])) walk(imp);
  }
  walk(AppModule);

  // Step 2: Extract routes from decorators
  interface Route {
    ctrl: string;
    path: string;
    method: string;
    methodName: string;
    hasBody: boolean;
    hasQuery: boolean;
    hasParams: boolean;
    queryKey?: string;
    paramKeys: string[];
  }

  const routes: Route[] = [];

  for (const ctrl of controllers) {
    const target = ctrl as new (...a: any[]) => any;
    if (!Reflect.getMetadata(CONTROLLER_WATERMARK, target)) continue;

    const prefix = Reflect.getMetadata(PATH_METADATA, target) || '';
    const normPrefix = prefix === '/' ? '' : prefix;

    for (const mn of Object.getOwnPropertyNames(target.prototype)) {
      if (mn === 'constructor' || typeof target.prototype[mn] !== 'function') continue;
      const fn = target.prototype[mn];

      // SSE
      const ssePath: string | undefined = Reflect.getMetadata(SSE_METADATA, fn);
      if (ssePath) {
        const fp = `${normPrefix}${ssePath === '/' ? '' : ssePath}` || '/';
        routes.push({ ctrl: target.name, path: fp, method: 'get', methodName: mn, hasBody: false, hasQuery: false, hasParams: false, paramKeys: [] });
        continue;
      }

      // HTTP
      const httpMethod: RequestMethod = Reflect.getMetadata(METHOD_METADATA, fn);
      if (!httpMethod) continue;

      const pm = Reflect.getMetadata(PATH_METADATA, fn) || '/';
      let fp = `${normPrefix}${pm === '/' ? '' : pm}` || '/';

      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target, mn) || {};
      const hasBody = Object.keys(args).some(k => Number(k.split(':')[0]) === RouteParamtypes.BODY);
      const hasQuery = Object.keys(args).some(k => Number(k.split(':')[0]) === RouteParamtypes.QUERY);
      const hasParams = Object.keys(args).some(k => Number(k.split(':')[0]) === RouteParamtypes.PARAM);

      // Extract param keys from path
      const paramKeys = (fp.match(/:(\w+)/g) || []).map(p => p.slice(1));

      routes.push({
        ctrl: target.name, path: fp, method: httpMethod === RequestMethod.DELETE ? 'delete' : httpMethod,
        methodName: mn, hasBody, hasQuery, hasParams, paramKeys,
      });
    }
  }

  // Step 3: TypeScript Compiler API — extract types
  const moduleDir = path.dirname(path.resolve(process.cwd(), modulePath!));
  const sourceFiles = new Set<string>();
  const ctrlSourceMap = new Map<string, string>();

  // Scan source files
  for (const file of new Bun.Glob('**/*.ts').scanSync({ cwd: moduleDir })) {
    const fp = path.join(moduleDir, file);
    sourceFiles.add(fp);
    const content = fs.readFileSync(fp, 'utf-8');
    for (const route of routes) {
      if (content.includes(`class ${route.ctrl}`) && !ctrlSourceMap.has(route.ctrl)) {
        ctrlSourceMap.set(route.ctrl, fp);
      }
    }
  }

  // Build TS program
  let opts: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    experimentalDecorators: true, emitDecoratorMetadata: true,
    strict: true, skipLibCheck: true,
  };
  const cfgPath = ts.findConfigFile(moduleDir, ts.sys.fileExists, 'tsconfig.json');
  if (cfgPath) {
    const p = ts.readConfigFile(cfgPath, ts.sys.readFile);
    if (p.config) opts = { ...opts, ...ts.convertCompilerOptionsFromJson(p.config.compilerOptions || {}, moduleDir).options };
  }

  const program = ts.createProgram([...sourceFiles], opts);
  const checker = program.getTypeChecker();

  // Type extraction helpers
  function resolveType(type: ts.Type, depth = 0): string {
    if (depth > 5) return 'any';

    // Array
    if (checker.isArrayType(type)) {
      const args = checker.getTypeArguments(type as ts.TypeReference);
      return args.length > 0 ? `${resolveType(args[0], depth + 1)}[]` : 'any[]';
    }

    // Promise<T>
    const sym = type.getSymbol();
    if (sym?.name === 'Promise') {
      const args = checker.getTypeArguments(type as ts.TypeReference);
      return args.length > 0 ? resolveType(args[0], depth + 1) : 'any';
    }

    // Primitives
    if (type.flags & ts.TypeFlags.String) return 'string';
    if (type.flags & ts.TypeFlags.Number) return 'number';
    if (type.flags & ts.TypeFlags.Boolean || type.flags & ts.TypeFlags.BooleanLiteral) return 'boolean';
    if (type.flags & ts.TypeFlags.Null) return 'null';
    if (type.flags & ts.TypeFlags.Undefined) return 'undefined';
    if (type.flags & ts.TypeFlags.Void) return 'void';
    if (type.flags & ts.TypeFlags.Any) return 'any';

    // Union
    if (type.isUnion()) return type.types.map(t => resolveType(t, depth + 1)).join(' | ');

    // Object literal — expand fields
    if (type.flags & ts.TypeFlags.Object) {
      const props = type.getProperties();
      if (props.length > 0 && !sym?.name?.match(/^[A-Z]/) /* skip named classes */) {
        const fields = props.map(p => {
          let pt = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || p.declarations![0]);
          const isOpt = (p.flags & ts.SymbolFlags.Optional) !== 0;
          // For optional fields, TS adds `undefined` to the union — strip it
          if (isOpt && pt.isUnion()) {
            const nonUndef = pt.types.filter(t => !(t.flags & ts.TypeFlags.Undefined));
            if (nonUndef.length === 1) pt = nonUndef[0];
          }
          return `  ${p.name}${isOpt ? '?' : ''}: ${resolveType(pt, depth + 1)}`;
        });
        return `{\n${fields.join(';\n')};\n}`;
      }
    }

    return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  }

  function extractMethodTypes(className: string, methodName: string) {
    const srcPath = ctrlSourceMap.get(className);
    if (!srcPath) return { ret: 'unknown', body: null as string | null, query: null as string | null };

    const sf = program.getSourceFile(srcPath);
    if (!sf) return { ret: 'unknown', body: null as string | null, query: null as string | null };

    let ret = 'unknown', body: string | null = null, query: string | null = null;

    function visit(node: ts.Node) {
      if (ts.isClassDeclaration(node) && node.name?.text === className) {
        for (const member of node.members) {
          if (!ts.isMethodDeclaration(member) || !member.name || !ts.isIdentifier(member.name) || member.name.text !== methodName) continue;

          // Return type
          const sig = checker.getSignatureFromDeclaration(member);
          if (sig) ret = resolveType(checker.getReturnTypeOfSignature(sig));

          // Params
          for (const param of member.parameters) {
            const decs = ts.getDecorators(param) || [];
            for (const dec of decs) {
              if (!ts.isCallExpression(dec.expression) || !ts.isIdentifier(dec.expression.expression)) continue;
              const decName = dec.expression.expression.text;

              if (decName === 'Body' && param.type) {
                const paramType = checker.getTypeAtLocation(param);
                body = resolveType(paramType);
              }
              if (decName === 'Query') {
                if (param.type) {
                  const paramType = checker.getTypeAtLocation(param);
                  query = resolveType(paramType);
                } else {
                  query = 'Record<string, string>';
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
    return { ret, body, query };
  }

  // Step 4: Enrich routes with types
  const enriched = routes.map(r => {
    const { ret, body, query } = extractMethodTypes(r.ctrl, r.methodName);
    return { ...r, retType: ret, bodyType: body, queryType: query };
  });

  // Step 5: Generate named interfaces + Elysia chain
  const interfaces = new Map<string, string>();
  let ifaceCounter = 0;

  function internType(typeStr: string, hint: string): string {
    // Only create named interfaces for multiline object types
    if (!typeStr.includes('\n')) return typeStr;

    // Check if we already have this interface
    for (const [name, def] of interfaces) {
      if (def === typeStr) return name;
    }

    const name = hint.charAt(0).toUpperCase() + hint.slice(1);
    const uniqueName = interfaces.has(name) ? `${name}${++ifaceCounter}` : name;
    interfaces.set(uniqueName, typeStr);
    return uniqueName;
  }

  // Generate TypeBox from inferred body type string
  function typeToTypebox(typeStr: string): string {
    const s = typeStr.trim();
    if (s === 'string') return 't.String()';
    if (s === 'number') return 't.Number()';
    if (s === 'boolean') return 't.Boolean()';
    if (s === 'any') return 't.Any()';
    if (s === 'null') return 't.Null()';

    // Handle union: undefined | string → t.Optional(t.String())
    if (s.includes(' | ')) {
      const parts = s.split(' | ').map(p => p.trim()).filter(p => p !== 'undefined');
      if (parts.length === 0) return 't.Any()';
      if (parts.length === 1) return `t.Optional(${typeToTypebox(parts[0])})`;
      return `t.Union([${parts.map(p => typeToTypebox(p)).join(', ')}])`;
    }

    // Array
    if (s.endsWith('[]')) return `t.Array(${typeToTypebox(s.slice(0, -2).trim())})`;

    // Object with fields
    if (s.startsWith('{')) {
      const fields = s.replace(/^\{|\}$/g, '').split(';').filter(f => f.trim());
      const tbFields = fields.map(f => {
        const m = f.trim().match(/^(\w+)(\?)?\s*:\s*(.+)$/);
        if (!m) return '';
        const [, name, opt, ftype] = m;
        const tb = typeToTypebox(ftype.trim());
        return opt ? `${name}: t.Optional(${tb})` : `${name}: ${tb}`;
      }).filter(Boolean);
      return `{ ${tbFields.join(', ')} }`;
    }

    return 't.Any()';
  }

  // Build the chain
  const chainLines: string[] = [];
  for (const r of enriched) {
    const isArrayRet = r.retType.trimEnd().endsWith('[]');
    const elementType = isArrayRet ? r.retType.trimEnd().slice(0, -2).trimEnd() : r.retType;

    // Intern the element type (creates named interface if it's a multiline object)
    const typeName = internType(elementType, `${r.ctrl.replace('Controller', '')}Item`);
    const castType = isArrayRet ? `${typeName}[]` : typeName;

    // Build route options
    const opts: string[] = [];
    if (r.bodyType) opts.push(`body: t.Object(${typeToTypebox(r.bodyType)})`);
    if (r.paramKeys.length > 0) {
      const paramFields = r.paramKeys.map(k => `${k}: t.String()`).join(', ');
      opts.push(`params: t.Object({ ${paramFields} })`);
    }

    const optsStr = opts.length > 0 ? `, { ${opts.join(', ')} }` : '';

    chainLines.push(`  .${r.method}("${r.path}", () => ({} as ${castType})${optsStr})`);
  }

  // Step 6: Build output
  const ifaceBlocks = [...interfaces.entries()].map(([name, def]) =>
    `interface ${name} ${def}`
  ).join('\n\n');

  const finalPath = outputPath || modulePath!.replace(/\.ts$/, '.eden.ts');

  const output = `/**
 * AUTO-GENERATED by Eden Type Generator v3
 * Do NOT edit manually — regenerate with:
 *   bun run eden:generate ${modulePath}${outputPath ? ` --output ${outputPath}` : ''}
 */
import { Elysia, t } from 'elysia';

// ─── Inferred Types ──────────────────────────────────────────────
${ifaceBlocks || '// (all types are inline)'}

// ─── Route Definitions ──────────────────────────────────────────

const _app = new Elysia()
${chainLines.join('\n')};

export type App = typeof _app;
`;

  await Bun.write(finalPath, output);

  const elapsed = Date.now() - startTime;
  console.log(`\n✅ Generated ${finalPath} (${enriched.length} routes, ${elapsed}ms)\n`);
  for (const r of enriched) {
    const body = r.bodyType ? `  body: ${r.bodyType.replace(/\n/g, ' ')}` : '';
    const retShort = r.retType.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    console.log(`   ${r.method.toUpperCase().padEnd(6)} ${r.path.padEnd(25)} → ${retShort}${body ? `  (${body})` : ''}`);
  }
  console.log('');
}

// ─── Execute ─────────────────────────────────────────────────────

await generate();

if (watchMode) {
  const moduleDir = path.dirname(path.resolve(process.cwd(), modulePath!));
  console.log(`👀 Watching ${moduleDir} for changes...\n`);

  let debounce: Timer | null = null;
  fs.watch(moduleDir, { recursive: true }, (event, filename) => {
    if (!filename?.endsWith('.ts') || filename.includes('eden')) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(async () => {
      console.log(`\n🔄 ${filename} changed, regenerating...`);
      try { await generate(); } catch (e) { console.error('❌', e); }
    }, 300);
  });

  // Keep alive
  await new Promise(() => {});
}
