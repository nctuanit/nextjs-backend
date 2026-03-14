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
import { GATEWAY_METADATA, PATTERN_METADATA, MESSAGE_MAPPING_METADATA, type GatewayOptions } from '../decorators/websocket.decorator';
import { RequestMethod } from '../decorators/method.decorator';
import { RouteParamtypes, type RouteParamMetadata } from '../decorators/param.decorator';
import { type CanActivate, type NestInterceptor, type PipeTransform, type ExceptionFilter, type NestMiddleware } from '../interfaces';
import { FILTER_CATCH_EXCEPTIONS } from '../decorators/catch.decorator';
import { HttpException, ForbiddenException } from '../exceptions';
import { MODULE_METADATA } from '../constants';
import { type Type, type Provider, type InjectionToken } from '../di/provider';
import { Logger } from '../services/logger.service';
import { SessionService } from '../session/session.service';
import { SESSION_OPTIONS } from '../session/session.module';
import { PLUGINS_CONFIG, type PluginsModuleOptions } from '../plugins/plugins.module';
import { RATE_LIMIT_METADATA, type RateLimitOptions } from '../decorators/rate-limit.decorator';
import { DEV_MODE_CONFIG, DevModeService, type DevModeConfig } from '../dev-mode/dev-mode.service';
import { DevModeLoggerMiddleware } from '../dev-mode/dev-mode.middleware';
import cors from '@elysiajs/cors';
import { helmet } from 'elysia-helmet';
import { rateLimit } from 'elysia-rate-limit';

export interface FactoryOptions {
  globalPrefix?: string;
  globalFilters?: (Type<ExceptionFilter> | ExceptionFilter)[];
  globalMiddlewares?: (Type<NestMiddleware> | NestMiddleware)[];
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
    
    let app = new Elysia({ prefix: options?.globalPrefix });

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

    // Try to inject Global Plugins if PluginsModule is registered
    try {
      const pluginsConfig = await globalContainer.resolve(PLUGINS_CONFIG) as PluginsModuleOptions;
      if (pluginsConfig) {
        if (pluginsConfig.cors) {
          app.use(cors(typeof pluginsConfig.cors === 'object' ? pluginsConfig.cors : undefined));
          this.logger.log('CORS Plugin registered globally.');
        }
        if (pluginsConfig.helmet) {
          app.use(helmet(typeof pluginsConfig.helmet === 'object' ? pluginsConfig.helmet : undefined));
          this.logger.log('Helmet Security Plugin registered globally.');
        }
      }
    } catch(e) { /* ignore if PluginsModule is not imported */ }
    // Check if DevMode is active
    let devModeActive = false;
    try {
      const devModeConfig = await globalContainer.resolve(DEV_MODE_CONFIG) as DevModeConfig;
      if (devModeConfig && devModeConfig.enabled) {
        devModeActive = true;
        this.logger.log('Dev Mode Profiler is ACTIVE. Performance may be impacted.');
        
        // Inject profiler hooks via Elysia lifecycles instead of middleware to guarantee accurate timing and status observation
        const devModeService = await globalContainer.resolve(DevModeService) as DevModeService;
        
        let reqStartTimes = new Map<string, number>();

        app = app.onRequest(({ request }) => {
            const reqId = crypto.randomUUID();
            (request as any).reqId = reqId;
            reqStartTimes.set(reqId, performance.now());
        });
        
        app = app.onAfterResponse(({ request, set, body }) => {
            // console.log('[DEV_MODE_HOOK] Fired for', request.method, request.url);
            try {
                const reqId = (request as any).reqId;
                const start = reqId ? reqStartTimes.get(reqId) || performance.now() : performance.now();
                if (reqId) reqStartTimes.delete(reqId);
                const durationMs = performance.now() - start;
                
                const reqHeaders: Record<string, string> = {};
                request.headers.forEach((v, k) => reqHeaders[k] = v);

                const url = new URL(request.url);
                
                // Reconcile status
                let status = set.status;
                if (!status) status = 200;

                const isError = typeof status === 'number' ? status >= 400 : parseInt(status as string) >= 400;

                devModeService.recordRequest({
                    id: reqId || crypto.randomUUID(),
                    method: request.method,
                    url: url.pathname,
                    status: typeof status === 'number' ? status : parseInt(status as string) || 200,
                    durationMs,
                    timestamp: new Date(),
                    headers: reqHeaders,
                    query: Object.fromEntries(url.searchParams.entries()),
                    body: body,
                    error: isError ? 'Error observed by profiler' : undefined
                });
            } catch(hookError) {
                console.error('[DEV_MODE_CRASH]', hookError);
            }
        }) as any;
      }
    } catch(e) { 
        console.error('[DEV_MODE_INIT_ERROR]', e);
    }
    // Global Middlewares (onRequest hook)
    if (options?.globalMiddlewares && options.globalMiddlewares.length > 0) {
      app.onRequest(async (context) => {
        for (const middlewareClassOrInstance of options.globalMiddlewares!) {
          // Resolve if it's a class
          const middlewareInstance = (typeof middlewareClassOrInstance === 'function' && !('use' in middlewareClassOrInstance))
            ? await globalContainer.resolve(middlewareClassOrInstance as Type<unknown>) as NestMiddleware
            : middlewareClassOrInstance as NestMiddleware;
            
          await middlewareInstance.use(context.request, context.set, () => Promise.resolve());
        }
      });
    }

    // Global Error Handler
    app.onError(({ error, set }) => {
      console.error(error);
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

        // Retrieve Cache Metadata explicitly and inject into the runner
        const cacheKeyMeta = Reflect.getMetadata('cache_module:cache_key', methodFn);
        const cacheTtlMeta = Reflect.getMetadata('cache_module:cache_ttl', methodFn);

        // Retrieve Rate Limit metadata
        const controllerRateLimit = Reflect.getMetadata(RATE_LIMIT_METADATA, constructorTarget);
        const methodRateLimit = Reflect.getMetadata(RATE_LIMIT_METADATA, methodFn);
        const rateLimitConfig = methodRateLimit || controllerRateLimit;

        // Map the method descriptor back to Elysia handlers
        const elysiaMethod = httpMethod === RequestMethod.DELETE ? 'delete' : httpMethod;

        // Using type assertion for dynamic method calling on Elysia instance
        const elysiaApp = app as unknown as Record<string, Function>;
        
        if (typeof elysiaApp[elysiaMethod] === 'function') {
           this.logger.log(`Mapped {${fullPath}, ${httpMethod}} route`, 'RouterExplorer');
           
           // Extract base configuration 
           const routeConfig: any = {
             ...builtSchema,
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
           };

           // Apply Elysia Rate Limit directly to the specific route generator if configured
           let finalAppRoute: any = elysiaApp;
           if (rateLimitConfig) {
             const rlOpts = rateLimitConfig as RateLimitOptions;
             finalAppRoute = finalAppRoute.use(rateLimit({
                max: rlOpts.max || 100,
                duration: rlOpts.duration || 60,
                headers: true, // Inject X-RateLimit-* headers
                generator: (req: Request) => `${fullPath}-${req.headers.get('x-forwarded-for') || req.headers.get('host') || 'local'}`
             }));
           }

           finalAppRoute[elysiaMethod](
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
                  
                  // Inject Metadata so Interceptors can respond (like CacheInterceptor)
                  if (cacheKeyMeta) (context as any).cacheKey = cacheKeyMeta;
                  if (cacheTtlMeta) (context as any).cacheTtl = cacheTtlMeta;

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
             routeConfig
          );
        }
      }
    }

    // Initialize WebSockets Gateways
    for (const provider of providers) {
      const providerClass = typeof provider === 'function' ? provider : (provider as any).useClass;
      if (!providerClass) continue;

      const gatewayOptions: GatewayOptions = Reflect.getMetadata(GATEWAY_METADATA, providerClass);
      if (gatewayOptions) {
        // Instantiate the gateway via DI
        const instance = await globalContainer.resolve(providerClass) as any;
        const prototype = Object.getPrototypeOf(instance);
        const methodsNames = Object.getOwnPropertyNames(prototype).filter(
          (method) => method !== 'constructor' && typeof prototype[method] === 'function',
        );

        const wsPath = gatewayOptions.path || '/ws';
        const wsNamespace = gatewayOptions.namespace ? `/${gatewayOptions.namespace}` : '';
        const fullWsPath = `${wsNamespace}${wsPath}`;

        ElysiaFactory.logger.log(`Mapped WebSockets Gateway to path {${fullWsPath}}`, 'RouterExplorer');

        // We use Elysia's native App.ws() plugin capability
        app.ws(fullWsPath, {
          open(ws) {
            // Optional lifecycle hook: handleConnection()
            if (typeof instance.handleConnection === 'function') {
              instance.handleConnection(ws);
            }
          },
          message(ws, rawMessage) {
            let event = '';
            let data: any = rawMessage;

            // Handle NestJS formatted WS messages: { event: 'string', data: any }
            if (typeof rawMessage === 'object' && rawMessage !== null && 'event' in rawMessage) {
              const msgObj = rawMessage as { event: string; data?: any };
              event = msgObj.event;
              data = msgObj.data;
            } else if (typeof rawMessage === 'string') {
               try {
                  const parsed = JSON.parse(rawMessage);
                  if (parsed.event) {
                    event = parsed.event;
                    data = parsed.data;
                  }
               } catch (e) {
                 // Ignore standard string un-parseable messages
               }
            }

            // Route standard NestJS @SubscribeMessage() events
            for (const methodName of methodsNames) {
              const methodFn = prototype[methodName];
              const isMessageHandler = Reflect.getMetadata(MESSAGE_MAPPING_METADATA, methodFn);
              const messagePattern = Reflect.getMetadata(PATTERN_METADATA, methodFn);

              // If event matches the explicit pattern, or if it isn't an 'event' envelope just forward to everything?
              // Standard behavior is only mapping matched events
              if (isMessageHandler && messagePattern === event) {
                const responseData = methodFn.call(instance, data, ws);
                
                // If it returns a promise, resolve and optionally send back
                if (responseData instanceof Promise) {
                  responseData.then(res => {
                    if (res) ws.send(res);
                  }).catch(err => {
                    ElysiaFactory.logger.error(`WebSocket Error inside ${providerClass.name}.${methodName}: ${err}`, 'WebSocketGateway');
                  });
                } else if (responseData) {
                  ws.send(responseData);
                }
              }
            }
          },
          close(ws, code, message) {
            // Optional lifecycle hook: handleDisconnect()
            if (typeof instance.handleDisconnect === 'function') {
              instance.handleDisconnect(ws, code, message);
            }
          }
        });
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

