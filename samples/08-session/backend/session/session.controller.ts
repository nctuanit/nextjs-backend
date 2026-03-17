import 'reflect-metadata';
import {
  Controller, Get, Post, Delete,
  Body, Inject, Query
} from 'next-js-backend';
import { SessionService } from 'next-js-backend';

@Controller('/session')
export class SessionController {
  constructor(
    @Inject(SessionService) private readonly session: SessionService,
  ) {}

  /** POST /api/session/create — create a new session with data */
  @Post('/create')
  async create(@Body() body: { userId: string; name: string; role: string }) {
    const sessionId = await this.session.createSession({
      userId: body.userId,
      name: body.name,
      role: body.role,
      createdAt: new Date().toISOString(),
    });
    return { sessionId, message: 'Session created' };
  }

  /** GET /api/session/read?id=... — read session data */
  @Get('/read')
  async read(@Query() query: Record<string, string>) {
    const sessionId = (query as any)?.id as string;
    if (!sessionId) return { error: 'Missing ?id= param' };
    const data = await this.session.getSession(sessionId);
    if (!data) return { error: 'Session not found or expired', sessionId };
    return { sessionId, data };
  }

  /** DELETE /api/session/destroy — destroy a session */
  @Delete('/destroy')
  async destroy(@Body() body: { sessionId: string }) {
    await this.session.destroySession(body.sessionId);
    return { destroyed: true, sessionId: body.sessionId };
  }
}
