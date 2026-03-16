# CLI

The `next-js-backend` CLI provides project scaffolding and code generation tools.

## Installation

```bash
npx next-js-backend --help
# or install globally
npm install -g next-js-backend
```

## Commands

### `new` — Create a project

```bash
npx next-js-backend new my-api
cd my-api
bun install
bun run dev
```

Generates a complete project structure with `AppModule`, `AppController`, `AppService`, `tsconfig.json`, `package.json`, and `.env`.

### `generate` (`g`) — Generate code

```bash
npx next-js-backend g <type> <name>
```

| Type | Alias | Generates |
|------|-------|-----------|
| `module` | `mo` | Module file |
| `controller` | `co` | Controller with CRUD |
| `service` | `s` | Injectable service |
| `guard` | `gu` | Auth guard |
| `interceptor` | `in` | Request interceptor |
| `resource` | `res` | Module + Controller + Service |

### Examples

```bash
# Full CRUD resource
npx next-js-backend g resource products

# Individual files
npx next-js-backend g module orders
npx next-js-backend g controller orders
npx next-js-backend g service orders

# Guard
npx next-js-backend g guard jwt-auth

# Custom output path
npx next-js-backend g service auth --path src/modules/auth
```

### `eden:generate` — Eden Treaty types

Generate fully type-safe client types from your application:

```bash
npx next-js-backend eden:generate src/app.module.ts --output eden.d.ts
```

Or via npm script:

```bash
bun run eden:generate
```

## Script Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "dev": "bun run --watch src/main.ts",
    "g:resource": "npx next-js-backend g resource",
    "g:module": "npx next-js-backend g module",
    "eden:generate": "npx next-js-backend eden:generate src/app.module.ts"
  }
}
```

## Options

| Flag | Description |
|------|-------------|
| `--path <dir>` | Custom output directory |
| `--force` | Overwrite existing files |
| `--output <file>` | (eden:generate) Output file path |
| `--help, -h` | Show help |
| `--version, -v` | Show version |
