#!/usr/bin/env bun
export {};

import { join, resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';

// ─── Constants ───────────────────────────────────────────────────

const VERSION = '2.0.0';
const DOCS_URL = 'https://nctuanit.github.io/nextjs-backend/';

// ─── ANSI Colors ─────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
} as const;

function log(msg: string) { console.log(msg); }
function success(msg: string) { log(`  ${c.green}✅ ${msg}${c.reset}`); }
function error(msg: string) { console.error(`  ${c.red}❌ ${msg}${c.reset}`); }
function info(msg: string) { log(`  ${c.cyan}ℹ${c.reset}  ${msg}`); }

// ─── Arg Parsing ─────────────────────────────────────────────────

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const raw = argv.slice(2);
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = raw[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      flags[arg.slice(1)] = true;
    } else {
      positional.push(arg);
    }
  }

  return {
    command: positional[0] ?? '',
    positional: positional.slice(1),
    flags,
  };
}

// ─── Help ────────────────────────────────────────────────────────

function printBanner() {
  log(`
  ${c.cyan}${c.bold}╔══════════════════════════════════════════════════╗
  ║          next-js-backend CLI  v${VERSION}            ║
  ╚══════════════════════════════════════════════════╝${c.reset}
  `);
}

function printHelp() {
  printBanner();
  log(`  ${c.bold}Usage:${c.reset}
    ${c.dim}$${c.reset} npx next-js-backend ${c.cyan}<command>${c.reset} ${c.dim}[options]${c.reset}

  ${c.bold}Commands:${c.reset}
    ${c.cyan}new${c.reset} <project-name>              Create a new project
    ${c.cyan}generate|g${c.reset} <type> <name>        Generate code scaffolding
    ${c.cyan}eden:generate${c.reset} <module-path>     Generate Eden Treaty types
    ${c.cyan}--version, -v${c.reset}                   Show version
    ${c.cyan}--help, -h${c.reset}                      Show this help

  ${c.bold}Generate types:${c.reset}
    ${c.green}module${c.reset}       ${c.dim}(mo)${c.reset}   Module file
    ${c.green}controller${c.reset}   ${c.dim}(co)${c.reset}   Controller with CRUD routes
    ${c.green}service${c.reset}      ${c.dim}(s)${c.reset}    Injectable service
    ${c.green}guard${c.reset}        ${c.dim}(gu)${c.reset}   Auth guard
    ${c.green}interceptor${c.reset}  ${c.dim}(in)${c.reset}   Request interceptor
    ${c.green}resource${c.reset}     ${c.dim}(res)${c.reset}  Module + Controller + Service

  ${c.bold}Examples:${c.reset}
    ${c.dim}$${c.reset} npx next-js-backend new my-api
    ${c.dim}$${c.reset} npx next-js-backend g module users
    ${c.dim}$${c.reset} npx next-js-backend g resource products
    ${c.dim}$${c.reset} npx next-js-backend eden:generate src/app.module.ts --output eden.d.ts
  `);
}

// ─── Utils ───────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

async function writeFile(filePath: string, content: string): Promise<void> {
  if (existsSync(filePath)) {
    error(`File already exists: ${filePath}`);
    error('Use --force to overwrite.');
    process.exit(1);
  }
  ensureDir(join(filePath, '..'));
  await Bun.write(filePath, content);
  success(`CREATE ${filePath}`);
}

async function writeFileForce(filePath: string, content: string): Promise<void> {
  ensureDir(join(filePath, '..'));
  await Bun.write(filePath, content);
  success(`CREATE ${filePath}`);
}

// ─── NEW PROJECT ─────────────────────────────────────────────────

async function handleNew(positional: string[]) {
  const projectName = positional[0];
  if (!projectName) {
    error('Please provide a project name.');
    info('Usage: npx next-js-backend new <project-name>');
    process.exit(1);
  }

  if (!/^[a-z0-9][\w.-]*$/i.test(projectName)) {
    error('Invalid project name. Use alphanumeric characters, hyphens, dots, or underscores.');
    process.exit(1);
  }

  const projectDir = resolve(process.cwd(), projectName);

  if (existsSync(projectDir)) {
    error(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  printBanner();
  log(`  ${c.bold}Creating project:${c.reset} ${c.cyan}${projectName}${c.reset}\n`);

  // Create directories
  for (const dir of ['src/modules/app']) {
    ensureDir(join(projectDir, dir));
  }

  // package.json
  await writeFileForce(join(projectDir, 'package.json'), JSON.stringify({
    name: projectName,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'bun run --watch src/main.ts',
      start: 'bun run src/main.ts',
      build: 'bun build src/main.ts --outdir dist --target bun',
      test: 'bun test',
      'eden:generate': 'npx next-js-backend eden:generate src/app.module.ts --output src/eden.d.ts',
    },
    dependencies: {
      'next-js-backend': 'latest',
      'elysia': '^1.4.0',
      'reflect-metadata': '^0.2.2',
    },
    devDependencies: {
      '@types/bun': 'latest',
      'typescript': '^5.0.0',
    },
  }, null, 2) + '\n');

  // tsconfig.json
  await writeFileForce(join(projectDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      outDir: './dist',
      declaration: true,
      types: ['bun-types'],
    },
    include: ['src/**/*.ts'],
  }, null, 2) + '\n');

  // .env
  await writeFileForce(join(projectDir, '.env'), `# Application\nPORT=3000\nNODE_ENV=development\n`);

  // .gitignore
  await writeFileForce(join(projectDir, '.gitignore'), [
    'node_modules/', 'dist/', '.env', '*.log', '.DS_Store',
  ].join('\n') + '\n');

  // src/main.ts
  await writeFileForce(join(projectDir, 'src/main.ts'), `import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  app.listen(process.env.PORT || 3000, () => {
    console.log(\`🚀 Server running at http://localhost:\${process.env.PORT || 3000}\`);
  });
}

bootstrap();
`);

  // app.module.ts
  await writeFileForce(join(projectDir, 'src/modules/app/app.module.ts'), `import { Module } from 'next-js-backend';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`);

  // app.controller.ts
  await writeFileForce(join(projectDir, 'src/modules/app/app.controller.ts'), `import { Controller, Get } from 'next-js-backend';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello() {
    return this.appService.getHello();
  }
}
`);

  // app.service.ts
  await writeFileForce(join(projectDir, 'src/modules/app/app.service.ts'), `import { Injectable } from 'next-js-backend';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Hello from next-js-backend! 🚀',
      docs: '${DOCS_URL}',
    };
  }
}
`);

  log('');
  log(`  ${c.green}${c.bold}Project created successfully!${c.reset}\n`);
  log(`  ${c.bold}Next steps:${c.reset}`);
  log(`    ${c.dim}$${c.reset} cd ${projectName}`);
  log(`    ${c.dim}$${c.reset} bun install`);
  log(`    ${c.dim}$${c.reset} bun run dev\n`);
  log(`  ${c.dim}📚 Docs: ${DOCS_URL}${c.reset}\n`);
}

// ─── GENERATE ────────────────────────────────────────────────────

type GenerateType = 'module' | 'controller' | 'service' | 'guard' | 'interceptor' | 'resource';

const TYPE_ALIASES: Record<string, GenerateType> = {
  module: 'module',     mo: 'module',
  controller: 'controller', co: 'controller',
  service: 'service',   s: 'service',
  guard: 'guard',       gu: 'guard',
  interceptor: 'interceptor', in: 'interceptor',
  resource: 'resource', res: 'resource',
};

async function handleGenerate(positional: string[], flags: Record<string, string | boolean>) {
  const rawType = positional[0];
  const rawName = positional[1];

  if (!rawType || !rawName) {
    error('Usage: npx next-js-backend g <type> <name>');
    info('Types: module, controller, service, guard, interceptor, resource');
    process.exit(1);
  }

  const type = TYPE_ALIASES[rawType];
  if (!type) {
    error(`Unknown type: "${rawType}"`);
    info('Valid types: module, controller, service, guard, interceptor, resource');
    process.exit(1);
  }

  const pascal = toPascalCase(rawName);
  const kebab = toKebabCase(rawName);
  const baseDir = typeof flags.path === 'string' ? flags.path : `src/modules/${kebab}`;

  log(`\n  ${c.bold}Generating ${c.cyan}${type}${c.reset}${c.bold}: ${pascal}${c.reset}\n`);

  switch (type) {
    case 'module':
      await genModule(baseDir, kebab, pascal);
      break;
    case 'controller':
      await genController(baseDir, kebab, pascal);
      break;
    case 'service':
      await genService(baseDir, kebab, pascal);
      break;
    case 'guard':
      await genGuard(kebab, pascal);
      break;
    case 'interceptor':
      await genInterceptor(kebab, pascal);
      break;
    case 'resource':
      await genModule(baseDir, kebab, pascal);
      await genController(baseDir, kebab, pascal);
      await genService(baseDir, kebab, pascal);
      log(`\n  ${c.dim}Don't forget to import ${pascal}Module into your AppModule!${c.reset}`);
      break;
  }

  log('');
}

// ─── Template Generators ─────────────────────────────────────────

async function genModule(dir: string, kebab: string, pascal: string) {
  await writeFile(`${dir}/${kebab}.module.ts`, `import { Module } from 'next-js-backend';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
})
export class ${pascal}Module {}
`);
}

async function genController(dir: string, kebab: string, pascal: string) {
  await writeFile(`${dir}/${kebab}.controller.ts`, `import { Controller, Get, Post, Put, Delete, Body, Param } from 'next-js-backend';
import { ${pascal}Service } from './${kebab}.service';

@Controller('/${kebab}')
export class ${pascal}Controller {
  constructor(private readonly ${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service: ${pascal}Service) {}

  @Get('/')
  findAll() {
    return this.${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service.findOne(id);
  }

  @Post('/')
  create(@Body() body: Record<string, unknown>) {
    return this.${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service.create(body);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service.update(id, body);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.${kebab.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())}Service.remove(id);
  }
}
`);
}

async function genService(dir: string, kebab: string, pascal: string) {
  await writeFile(`${dir}/${kebab}.service.ts`, `import { Injectable } from 'next-js-backend';

@Injectable()
export class ${pascal}Service {
  private items: Array<{ id: string; [key: string]: unknown }> = [];

  findAll() {
    return this.items;
  }

  findOne(id: string) {
    return this.items.find(item => item.id === id) ?? null;
  }

  create(data: Record<string, unknown>) {
    const item = { id: crypto.randomUUID(), ...data };
    this.items.push(item);
    return item;
  }

  update(id: string, data: Record<string, unknown>) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...data };
    return this.items[index];
  }

  remove(id: string) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    const [removed] = this.items.splice(index, 1);
    return removed;
  }
}
`);
}

async function genGuard(kebab: string, pascal: string) {
  await writeFile(`src/guards/${kebab}.guard.ts`, `import { Injectable, type CanActivate } from 'next-js-backend';
import type { Context } from 'elysia';

@Injectable()
export class ${pascal}Guard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    // TODO: Implement your authorization logic
    const request = context.request;
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return false;
    }

    return true;
  }
}
`);
}

async function genInterceptor(kebab: string, pascal: string) {
  await writeFile(`src/interceptors/${kebab}.interceptor.ts`, `import { Injectable, type NestInterceptor } from 'next-js-backend';
import type { Context } from 'elysia';

@Injectable()
export class ${pascal}Interceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>): Promise<unknown> {
    const start = performance.now();
    const result = await next();
    const duration = (performance.now() - start).toFixed(2);

    console.log(\`[\${context.request.method}] \${new URL(context.request.url).pathname} — \${duration}ms\`);

    return result;
  }
}
`);
}

// ─── EDEN GENERATE ───────────────────────────────────────────────

async function handleEdenGenerate(positional: string[], flags: Record<string, string | boolean>) {
  const args: string[] = [...positional];

  // Forward --output flag
  if (typeof flags.output === 'string') {
    args.push('--output', flags.output);
  }

  const scriptPath = join(import.meta.dir, '..', 'scripts', 'eden-generate.ts');

  if (!existsSync(scriptPath)) {
    error('Eden generate script not found.');
    info(`Expected at: ${scriptPath}`);
    process.exit(1);
  }

  const proc = Bun.spawn(['bun', 'run', scriptPath, ...args], {
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await proc.exited;
  process.exit(exitCode);
}

// ─── Main ────────────────────────────────────────────────────────

const parsed = parseArgs(process.argv);

// Version flag
if (parsed.flags.version || parsed.flags.v) {
  log(`next-js-backend v${VERSION}`);
  process.exit(0);
}

// Help or no command
if (!parsed.command || parsed.flags.help || parsed.flags.h) {
  printHelp();
  process.exit(0);
}

// Dispatch
switch (parsed.command) {
  case 'new':
    await handleNew(parsed.positional);
    break;
  case 'generate':
  case 'g':
    await handleGenerate(parsed.positional, parsed.flags);
    break;
  case 'eden:generate':
    await handleEdenGenerate(parsed.positional, parsed.flags);
    break;
  default:
    error(`Unknown command: "${parsed.command}"`);
    log('');
    printHelp();
    process.exit(1);
}
