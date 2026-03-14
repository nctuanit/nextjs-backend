#!/usr/bin/env bun
/**
 * Eden Type Generator
 * 
 * Generates a `.d.ts` file from your NestJS-style decorators so that
 * @elysiajs/eden can infer routes at compile time.
 * 
 * Usage:
 *   bun run scripts/eden-generate.ts ./path/to/app.module.ts
 *   bun run scripts/eden-generate.ts ./path/to/app.module.ts --output ./eden.d.ts
 * 
 * The generated file exports an `App` type that you can use with Eden Treaty:
 *   import type { App } from './eden';
 *   const api = treaty<App>('http://localhost:3000');
 *   const { data } = await api.users.get(); // ✅ Full autocomplete!
 */
import 'reflect-metadata';
import { CONTROLLER_WATERMARK, PATH_METADATA, METHOD_METADATA, MODULE_METADATA, ROUTE_ARGS_METADATA } from '../src/constants';
import { RequestMethod } from '../src/decorators/method.decorator';
import { SSE_METADATA } from '../src/decorators/sse.decorator';
import { RouteParamtypes, type RouteParamMetadata } from '../src/decorators/param.decorator';
import type { Type, Provider } from '../src/di/provider';

interface RouteInfo {
  path: string;
  method: string;
  hasBody: boolean;
  bodyFields: string[];
  returnType: string;
}

// Parse CLI args
const args = process.argv.slice(2);
const modulePath = args[0];
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : undefined;

if (!modulePath) {
  console.error('❌ Usage: bun run scripts/eden-generate.ts <module-path> [--output <output-path>]');
  console.error('   Example: bun run scripts/eden-generate.ts samples/eden-treaty/src/app.module.ts');
  process.exit(1);
}

// Dynamically import the module
const moduleFile = await import(Bun.resolveSync('./' + modulePath, process.cwd()));
const AppModule = moduleFile.AppModule || moduleFile.default || Object.values(moduleFile)[0];

if (!AppModule) {
  console.error(`❌ Could not find AppModule export in ${modulePath}`);
  process.exit(1);
}

// Recursively extract controllers from modules (same logic as ElysiaFactory)
const controllers: Type<unknown>[] = [];
const resolvedModules = new Set<unknown>();

function resolveModule(mod: any) {
  if (mod && typeof mod === 'object' && 'module' in mod) {
    if (resolvedModules.has(mod.module)) return;
    resolvedModules.add(mod.module);
    if (mod.controllers) controllers.push(...mod.controllers);
    const dynImports = mod.imports || [];
    for (const imp of dynImports) resolveModule(imp);
    resolveModule(mod.module);
    return;
  }

  if (resolvedModules.has(mod)) return;
  resolvedModules.add(mod);

  const modControllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, mod) || [];
  const modImports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, mod) || [];

  controllers.push(...modControllers);
  for (const imp of modImports) resolveModule(imp);
}

resolveModule(AppModule);

// Extract route information from controllers
const routes: RouteInfo[] = [];

for (const controllerClass of controllers) {
  const constructorTarget = controllerClass as new (...args: unknown[]) => unknown;
  const isController = Reflect.getMetadata(CONTROLLER_WATERMARK, constructorTarget);
  if (!isController) continue;

  const prefix = Reflect.getMetadata(PATH_METADATA, constructorTarget) || '';
  const normalizedPrefix = prefix === '/' ? '' : prefix;
  const prototype = constructorTarget.prototype;
  const methodsNames = Object.getOwnPropertyNames(prototype).filter(
    (method) => method !== 'constructor' && typeof prototype[method] === 'function',
  );

  for (const methodName of methodsNames) {
    const methodFn = prototype[methodName];

    // Check for SSE endpoints
    const ssePath: string | undefined = Reflect.getMetadata(SSE_METADATA, methodFn);
    if (ssePath) {
      let fullPath = `${normalizedPrefix}${ssePath === '/' ? '' : ssePath}`;
      if (!fullPath) fullPath = '/';
      routes.push({
        path: fullPath,
        method: 'get',
        hasBody: false,
        bodyFields: [],
        returnType: 'unknown',
      });
      continue;
    }

    // Check for regular HTTP endpoints
    const httpMethod: RequestMethod = Reflect.getMetadata(METHOD_METADATA, methodFn);
    if (!httpMethod) continue;

    const pathMetadata = Reflect.getMetadata(PATH_METADATA, methodFn) || '/';
    let fullPath = `${normalizedPrefix}${pathMetadata === '/' ? '' : pathMetadata}`;
    if (!fullPath) fullPath = '/';

    // Check if the method accepts a body
    const routeArgs = Reflect.getMetadata(ROUTE_ARGS_METADATA, constructorTarget, methodName) || {};
    const hasBody = Object.keys(routeArgs).some((key) => {
      const paramType = Number(key.split(':')[0]) as RouteParamtypes;
      return paramType === RouteParamtypes.BODY;
    });

    routes.push({
      path: fullPath,
      method: httpMethod,
      hasBody,
      bodyFields: [],
      returnType: 'unknown',
    });
  }
}

// Generate the Elysia type chain
function pathToElysiaChain(routes: RouteInfo[]): string {
  // Group by first path segment for nested types
  const lines: string[] = [];

  for (const route of routes) {
    const cleanPath = route.path.replace(/^\//, '');
    const segments = cleanPath ? cleanPath.split('/') : [''];
    
    // Build the Elysia .get() / .post() chain
    const bodyType = route.hasBody ? '{ body: Record<string, any> }' : '{}';
    const responseType = '{ 200: unknown }';
    
    lines.push(`  .${route.method}("${route.path}", () => ({} as any), ${route.hasBody ? `{ body: t.Object({}) }` : '{}'})`);
  }

  return lines.join('\n');
}

// Generate output file content
const output = `/**
 * AUTO-GENERATED by Eden Type Generator
 * Do NOT edit this file manually.
 * 
 * Regenerate with:
 *   bun run scripts/eden-generate.ts ${modulePath}${outputPath ? ` --output ${outputPath}` : ''}
 * 
 * Usage with Eden Treaty:
 *   import { treaty } from '@elysiajs/eden';
 *   import type { App } from '${outputPath ? outputPath.replace(/\.d\.ts$/, '').replace(/\.ts$/, '') : './eden'}';
 *   const api = treaty<App>('http://localhost:3000');
 */
import { Elysia, t } from 'elysia';

const _app = new Elysia()
${pathToElysiaChain(routes)};

export type App = typeof _app;
`;

// Write output
const finalPath = outputPath || modulePath.replace(/\.ts$/, '.eden.d.ts');
await Bun.write(finalPath, output);

console.log(`✅ Eden types generated successfully!`);
console.log(`   📄 Output: ${finalPath}`);
console.log(`   🔗 Routes found: ${routes.length}`);
routes.forEach(r => {
  console.log(`      ${r.method.toUpperCase().padEnd(6)} ${r.path}`);
});
console.log(`\n💡 Usage:`);
console.log(`   import { treaty } from '@elysiajs/eden';`);
console.log(`   import type { App } from '${finalPath.replace(/\.d\.ts$/, '').replace(/\.ts$/, '')}';`);
console.log(`   const api = treaty<App>('http://localhost:3000');`);
