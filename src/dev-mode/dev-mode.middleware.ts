import { Injectable } from '../di/injectable.decorator';
import { Middleware } from '../decorators/middleware.decorator';
import { NestMiddleware } from '../interfaces';
import { DevModeService } from './dev-mode.service';

/**
 * Global Middleware that intercepts requests during Dev Mode.
 * We inject timing logic and push data over to DevModeService.
 */
@Injectable()
@Middleware()
export class DevModeLoggerMiddleware implements NestMiddleware {
    constructor(private devModeService: DevModeService) {}

    async use(req: Request, res: unknown, next: () => void | Promise<void>) {
        const start = performance.now();
        const url = new URL(req.url);

        // We generate a simple request UUID
        const requestId = crypto.randomUUID();
        
        // Extract basic info before handling
        const method = req.method;
        const path = url.pathname;
        
        const reqHeaders: Record<string, string> = {};
        req.headers.forEach((v, k) => reqHeaders[k] = v);

        // Since Elysia handles body parsing via plugins / native handlers,
        // intercepting the *exact* parsed body object at this pure middleware level is tricky 
        // without cloning the request. We will mark what we can and rely on interceptors for deeper hooks later if needed.
        let bodyPayload: unknown = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const clonedReq = req.clone();
          bodyPayload = await clonedReq.json().catch(() => clonedReq.text()).catch(() => undefined);
        }

        let statusCode = (res as any)?.status || 200;
        let errorMessage: string | undefined = undefined;


        // Proceed with request
        try {
            await next();
            statusCode = (res as any)?.status || statusCode;
        } catch(e: unknown) {
            const err = e instanceof Error ? e : new Error(String(e));
            statusCode = (e as { status?: number })?.status || 500;
            errorMessage = err.message;
            throw e;
        } finally {
            const end = performance.now();
            const durationMs = end - start;
            
            this.devModeService.recordRequest({
                id: requestId,
                method,
                url: path,
                status: statusCode,
                durationMs,
                timestamp: new Date(),
                headers: reqHeaders,
                query: Object.fromEntries(url.searchParams.entries()),
                body: bodyPayload,
                error: errorMessage
            });
        }
    }
}
