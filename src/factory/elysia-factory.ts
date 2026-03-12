import { Elysia, type Context } from 'elysia';
import { globalContainer } from '../di/container';
import { 
  CONTROLLER_WATERMARK, 
  PATH_METADATA, 
  METHOD_METADATA, 
  ROUTE_ARGS_METADATA, 
  GUARDS_METADATA, 
  INTERCEPTORS_METADATA,
  SCHEMA_METADATA,
  PIPES_METADATA,
  FILTERS_METADATA
} from '../constants';
import { RequestMethod } from '../decorators/method.decorator';
import { RouteParamtypes, type RouteParamMetadata } from '../decorators/param.decorator';
import { type CanActivate, type NestInterceptor, type PipeTransform, type ExceptionFilter } from '../interfaces';
import { FILTER_CATCH_EXCEPTIONS } from '../decorators/catch.decorator';
import { HttpException, ForbiddenException } from '../exceptions';
import { MODULE_METADATA } from '../constants';
import { type Type, type Provider, type InjectionToken } from '../di/provider';
import { Logger } from '../services/logger.service';
import { SessionService } from '../session/session.service';
import { SESSION_OPTIONS } from '../session/session.module';

export interface FactoryOptions {
  globalPrefix?: string;
  globalFilters?: (Type<ExceptionFilter> | ExceptionFilter)[];
}

export class ElysiaFactory {
  private static readonly logger = new Logger('ElysiaFactory');

  static async create(module: Type<unknown>, options?: FactoryOptions): Promise<Elysia> {
    const banner = `
    _   __          __      _                  ____             __                  __
   / | / /___  _  _/ /_    (_)____            / __ )____ ______/ /_____  ____  ____/ /
  /  |/ / __ \\| |/_/ __/  / / ___/  ______   / __  / __ \`/ ___/ //_/ _ \\/ __ \\/ __  / 
 / /|  /  __/_>  </ /_   / (__  )  /_____/  / /_/ / /_/ / /__/ ,< /  __/ / / / /_/ /  
/_/ |_/\\___/_/|_|\\__/  _/ /____/           /_____/\\__,_/\\___/_/|_|\\___/_/ /_/\\__,_/   
                      /___/                                                           
                                                                          (v1.0.0)
    `;
    console.log(`\x1b[36m${banner}\x1b[0m`);
    this.logger.log('Starting Next.js-Backend application...');
    
    const app = new Elysia({ prefix: options?.globalPrefix });

    // Global Error Handler
    app.onError(({ error, set }) => {
      if (error instanceof HttpException) {
        set.status = error.getStatus();
        return error.getResponse();
      }
      
      // Fallback
      set.status = 500;
      return {
        message:
          error instanceof Error
            ? error.message
            : (error as Record<string, unknown>)?.message || 'Internal server error',
        statusCode: 500,
      };
    });

    // Extract module metadata recursively
    const controllers: Type<unknown>[] = [];
    const providers: Provider[] = [];
    
    // Store already resolved modules to prevent circular dependencies
    const resolvedModules = new Set<unknown>();

    const resolveModule = (mod: any) => {
      // Handle Dynamic Modules
      if (mod && typeof mod === 'object' && 'module' in mod) {
        if (resolvedModules.has(mod.module)) return;
        resolvedModules.add(mod.module);
        
        if (mod.controllers) controllers.push(...mod.controllers);
        if (mod.providers) providers.push(...mod.providers);
        
        // Dynamic modules can also have imports
        const dynImports = mod.imports || [];
        for (const imp of dynImports) resolveModule(imp);
        
        // Process the static parts of the dynamic module class
        resolveModule(mod.module);
        return;
      }

      // Handle Static Modules
      if (resolvedModules.has(mod)) return;
      resolvedModules.add(mod);

      const modImports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, mod) || [];
      const modControllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, mod) || [];
      const modProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, mod) || [];

      controllers.push(...modControllers);
      providers.push(...modProviders);

      for (const imp of modImports) resolveModule(imp);
    };

    resolveModule(module);

    // Register all collected providers into the container
    globalContainer.addProviders(providers);

    // Ensure all providers are resolved before taking requests
    for (const provider of providers) {
       let token: InjectionToken;
       if (typeof provider === 'function') {
           token = provider;
       } else if (provider && typeof provider === 'object' && 'provide' in provider) {
           token = provider.provide;
       } else {
           continue;
       }
       await globalContainer.resolve(token);
    }

    for (const controllerClass of controllers) {
      // We expect controllerClass to be a constructor function
      const constructorTarget = controllerClass as new (...args: unknown[]) => unknown;
      
      const isController = Reflect.getMetadata(CONTROLLER_WATERMARK, constructorTarget);
      if (!isController) {
        throw new Error(`${constructorTarget.name} is not a valid controller`);
      }

      // Resolve controller instance via DI container
      const instance = await globalContainer.resolve(constructorTarget) as Record<string, unknown>;
      
      const prefix = Reflect.getMetadata(PATH_METADATA, constructorTarget) || '';
      
      const prototype = Object.getPrototypeOf(instance);
      const methodsNames = Object.getOwnPropertyNames(prototype).filter(
        (method) => method !== 'constructor' && typeof prototype[method] === 'function',
      );

      for (const methodName of methodsNames) {
        const methodFn = prototype[methodName] as Function;
        
        const httpMethod: RequestMethod = Reflect.getMetadata(METHOD_METADATA, methodFn);
        if (!httpMethod) continue; // Not an endpoint

        const pathMetadata = Reflect.getMetadata(PATH_METADATA, methodFn) || '/';
        // Handle paths correctly. If root array we just use empty string to avoid trailing slashes
        const normalizedPrefix = prefix === '/' ? '' : prefix;
        // Keep standard routing rules
        let fullPath = `${normalizedPrefix}${pathMetadata === '/' ? '' : pathMetadata}`;
        if (!fullPath) fullPath = '/';

        const routeArgsMetadata = (Reflect.getMetadata(ROUTE_ARGS_METADATA, constructorTarget, methodName) || {}) as Record<string, RouteParamMetadata>;
        const schemaMetadata = Reflect.getMetadata(SCHEMA_METADATA, methodFn) || {};
        
        // Dynamically build Elysia Schemas from inline parameter decorators
        const builtSchema: Record<string, unknown> = { ...schemaMetadata };
        const bodySchemaProperties: Record<string, unknown> = {};
        const querySchemaProperties: Record<string, unknown> = {};
        const paramSchemaProperties: Record<string, unknown> = {};
        const headersSchemaProperties: Record<string, unknown> = {};
        let hasBodySchema = false;

        Object.keys(routeArgsMetadata).forEach((key) => {
          const metadata = routeArgsMetadata[key];
          const paramType = Number(key.split(':')[0]) as RouteParamtypes;
          
          if (metadata && metadata.schema) {
            if (paramType === RouteParamtypes.BODY) {
              if (metadata.data) {
                bodySchemaProperties[metadata.data] = metadata.schema;
                hasBodySchema = true;
              } else {
                // If the entire body is replaced by a schema (e.g @Body(t.Object(...)))
                builtSchema.body = metadata.schema;
              }
            } else if (paramType === RouteParamtypes.QUERY && metadata.data) {
              querySchemaProperties[metadata.data] = metadata.schema;
            } else if (paramType === RouteParamtypes.PARAM && metadata.data) {
              paramSchemaProperties[metadata.data] = metadata.schema;
            } else if (paramType === RouteParamtypes.HEADERS && metadata.data) {
              headersSchemaProperties[metadata.data.toLowerCase()] = metadata.schema;
            } else if (paramType === RouteParamtypes.FILE || paramType === RouteParamtypes.FILES) {
              // Files are part of the body but require special multi-part handling
              if (metadata.data) {
                bodySchemaProperties[metadata.data] = metadata.schema;
                hasBodySchema = true;
              }
            }
          }
        });

        // We only use Object schema wrapper if there wasn't a catch-all body schema already defined
        if (hasBodySchema && !builtSchema.body) {
           const { t } = require('elysia');
           builtSchema.body = t.Object(bodySchemaProperties);
        }

        if (Object.keys(querySchemaProperties).length > 0 && !builtSchema.query) {
           const { t } = require('elysia');
           builtSchema.query = t.Object(querySchemaProperties);
        }
        if (Object.keys(paramSchemaProperties).length > 0 && !builtSchema.params) {
           const { t } = require('elysia');
           builtSchema.params = t.Object(paramSchemaProperties);
        }
        if (Object.keys(headersSchemaProperties).length > 0 && !builtSchema.headers) {
           const { t } = require('elysia');
           builtSchema.headers = t.Object(headersSchemaProperties);
        }

        const controllerGuards = Reflect.getMetadata(GUARDS_METADATA, constructorTarget) || [];
        const methodGuards = Reflect.getMetadata(GUARDS_METADATA, methodFn) || [];
        const allGuards = [...controllerGuards, ...methodGuards];

        const controllerInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, constructorTarget) || [];
        const methodInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, methodFn) || [];
        const allInterceptors = [...controllerInterceptors, ...methodInterceptors];

        const controllerPipes = Reflect.getMetadata(PIPES_METADATA, constructorTarget) || [];
        const methodPipes = Reflect.getMetadata(PIPES_METADATA, methodFn) || [];
        const allPipes = [...controllerPipes, ...methodPipes];

        const controllerFilters = Reflect.getMetadata(FILTERS_METADATA, constructorTarget) || [];
        const methodFilters = Reflect.getMetadata(FILTERS_METADATA, methodFn) || [];
        const allFilters = [...(options?.globalFilters || []), ...controllerFilters, ...methodFilters];

        // Map the method descriptor back to Elysia handlers
        const elysiaMethod = httpMethod === RequestMethod.DELETE ? 'delete' : httpMethod;

        // Using type assertion for dynamic method calling on Elysia instance
        const elysiaApp = app as unknown as Record<string, Function>;
        
        if (typeof elysiaApp[elysiaMethod] === 'function') {
           this.logger.log(`Mapped {${fullPath}, ${httpMethod}} route`, 'RouterExplorer');
           elysiaApp[elysiaMethod](
             fullPath, 
             async (context: Context) => {
               // 1. Extract base args
               const extractedArgs = await ElysiaFactory.extractContextArgs(routeArgsMetadata, context);
               
               // 2. Get Typescript types of arguments
               const paramTypes = Reflect.getMetadata('design:paramtypes', prototype, methodName) || [];
               
               // 3. Apply Pipes (Transform/Validation)
               for (let i = 0; i < extractedArgs.length; i++) {
                 const metadataPair = Object.entries(routeArgsMetadata).find(([_, meta]) => meta.index === i);
                 if (!metadataPair) continue;

                 const [key, meta] = metadataPair;
                 const paramTypeNumber = Number(key.split(':')[0]) as RouteParamtypes;
                 
                 let argType: 'body' | 'query' | 'param' | 'custom' = 'custom';
                 if (paramTypeNumber === RouteParamtypes.BODY) argType = 'body';
                 if (paramTypeNumber === RouteParamtypes.QUERY) argType = 'query';
                 if (paramTypeNumber === RouteParamtypes.PARAM) argType = 'param';

                 const argMeta = {
                   type: argType,
                   metatype: paramTypes[i],
                   data: meta.data
                 };

                 // Run through all pipes
                 for (const pipeClass of allPipes) {
                   const pipeInstance = (typeof pipeClass === 'function' && !pipeClass.transform) 
                     ? await globalContainer.resolve(pipeClass as Type<unknown>) as PipeTransform
                     : pipeClass; // Handle both Class reference and pre-instantiated pipe (e.g new ValidationPipe())
                   
                   extractedArgs[i] = await pipeInstance.transform(extractedArgs[i], argMeta, context);
                 }
               }

               // execution wrapper for interceptors
               const executeMethod = async () => await methodFn.apply(instance, extractedArgs);
               let runner: () => Promise<unknown> = executeMethod;

               // Interceptors wrap the actual controller execution
               for (let i = allInterceptors.length - 1; i >= 0; i--) {
                 const interceptorClass = allInterceptors[i];
                 // Instantiate interceptor via DI
                 const interceptorInstance = await globalContainer.resolve(interceptorClass as Type<unknown>) as NestInterceptor;
                 const nextRunner = runner;
                 runner = async () => await interceptorInstance.intercept(context, nextRunner);
               }

               try {
                 return await runner();
               } catch (error: any) {
                 // Process Filters in Reverse Order (closest to method first)
                 for (let i = allFilters.length - 1; i >= 0; i--) {
                   const filterClassOrInstance = allFilters[i];
                   
                   const filterInstance = (typeof filterClassOrInstance === 'function' && !filterClassOrInstance.catch)
                     ? await globalContainer.resolve(filterClassOrInstance as Type<unknown>) as ExceptionFilter
                     : filterClassOrInstance as ExceptionFilter;
                     
                   // Which exceptions does this filter catch?
                   const catchTypes = Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, filterInstance.constructor) || [];
                   
                   // If @Catch() is empty, it catches everything. Otherwise, it must match the error type.
                   const shouldCatch = catchTypes.length === 0 || catchTypes.some((type: any) => error instanceof type);
                   
                   if (shouldCatch) {
                     return await filterInstance.catch(error, context);
                   }
                 }
                 
                 // Re-throw to Elysia's global error handler if no local filter caught it
                 throw error;
               }
             },
              {
               ...builtSchema,
               // Force JSON parsing if body exists but no strict schema is declared natively
               type: hasBodySchema ? 'json' : undefined,
               beforeHandle: async (context: Context) => {
                 for (const guard of allGuards) {
                   const guardInstance = await globalContainer.resolve(guard as Type<unknown>) as CanActivate;
                   const canActivate = await guardInstance.canActivate(context);
                   if (!canActivate) {
                     throw new ForbiddenException('Forbidden resource');
                   }
                 }
               }
             }
          );
        }
      }
    }

    return app as unknown as Elysia;
  }

  private static async extractContextArgs(routeArgsMetadata: Record<string, unknown>, context: Context): Promise<unknown[]> {
    const args: unknown[] = [];
    
    if (Object.keys(routeArgsMetadata).length === 0) {
      return [];
    }

    for (const key of Object.keys(routeArgsMetadata)) {
      const metadata = routeArgsMetadata[key] as RouteParamMetadata;
      const { index, data } = metadata;
      
      const paramType = Number(key.split(':')[0]) as RouteParamtypes;

      switch (paramType) {
        case RouteParamtypes.BODY:
          args[index] = data && typeof context.body === 'object' && context.body !== null 
            ? (context.body as Record<string, unknown>)[data as string] 
            : context.body;
          break;
        case RouteParamtypes.QUERY:
          args[index] = data 
            ? (context.query as Record<string, unknown>)?.[data as string] 
            : context.query;
          break;
        case RouteParamtypes.PARAM:
          args[index] = data 
            ? (context.params as Record<string, unknown>)?.[data as string] 
            : context.params;
          break;
        case RouteParamtypes.HEADERS:
          args[index] = data 
            ? (context.headers as Record<string, unknown>)?.[(data as string || '').toLowerCase()] 
            : context.headers;
          break;
        case RouteParamtypes.REQUEST:
          args[index] = context.request;
          break;
        case RouteParamtypes.RESPONSE:
          // Elysia context.set is used to modify response like status
          args[index] = context.set; 
          break;
        case RouteParamtypes.SESSION: {
          try {
            const sessionService = await globalContainer.resolve(SessionService) as any;
            const options = await globalContainer.resolve(SESSION_OPTIONS) as any;
            const cookieName = options.cookieName || 'sid';
            
            const cookieObj = (context.cookie as Record<string, any>)?.[cookieName];
            const cookieVal = cookieObj?.value;

            if (cookieVal) {
              const sessionData = await sessionService.getSession(cookieVal);
              args[index] = data && sessionData ? sessionData[data as string] : sessionData;
            } else {
              args[index] = null;
            }
          } catch (e) {
            // Unregistered SessionModule fallback
            args[index] = null;
          }
          break;
        }
        case RouteParamtypes.FILE:
        case RouteParamtypes.FILES:
          args[index] = data && typeof context.body === 'object' && context.body !== null 
            ? (context.body as Record<string, unknown>)[data as string] 
            : context.body;
          break;
        default:
          args[index] = null;
      }
    }

    return args;
  }

  /**
   * Helper function to directly mount the application into Next.js App Router.
   * Simply destruct the HTTP method verbs and export them in your `route.ts`.
   * e.g., export const { GET, POST, PUT, PATCH, DELETE } = ElysiaFactory.createNextJsHandlers(AppModule, { globalPrefix: '/api' });
   */
  static createNextJsHandlers(module: Type<unknown>, options?: FactoryOptions) {
    let appInstance: Elysia | null = null;
    
    // We instantiate the application only once (Singleton pattern)
    const getApp = async () => {
      if (!appInstance) {
        appInstance = await ElysiaFactory.create(module, options);
      }
      return appInstance;
    };

    const handler = async (req: Request) => {
      const app = await getApp();
      return app.handle(req);
    };

    return {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
      HEAD: handler,
    };
  }
}

