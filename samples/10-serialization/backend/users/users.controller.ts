import 'reflect-metadata';
import {
  Controller, Get,
  Injectable,
  Inject,
  Serialize, Exclude, Expose, Transform, Param, NotFoundException
} from 'next-js-backend';

// ── Response DTO with serialization decorators ────────────────────────────
export class UserResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose()
  @Transform((v: unknown) => (v as string)?.toUpperCase())
  role!: string;
  @Expose()
  @Transform((v: unknown) => new Date(v as string).toLocaleDateString('en-GB'))
  createdAt!: string;

  @Exclude() password!: string;
  @Exclude() internalNotes!: string;
}

// ── Raw "database" data ────────────────────────────────────────────────────
const DB_USERS = [
  { id: '1', name: 'Alice', role: 'admin', password: 'secret123', internalNotes: 'VIP user', createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Bob', role: 'user', password: 'mypass456', internalNotes: 'Trial account', createdAt: '2024-03-22T14:30:00Z' },
  { id: '3', name: 'Charlie', role: 'moderator', password: 'hunter2', internalNotes: 'Temp access', createdAt: '2024-05-10T08:45:00Z' },
];

@Controller('/users')
export class UsersController {
  /** GET /api/users — returns ALL fields (no serialization) */
  @Get('/raw')
  findAllRaw() {
    return DB_USERS;
  }

  /** GET /api/users/safe — @Serialize strips @Exclude() fields */
  @Get('/safe')
  @Serialize(UserResponseDto, { whitelist: true })
  findAllSafe() {
    return DB_USERS;
  }

  /** GET /api/users/:id/raw — one user, all fields */
  @Get('/:id/raw')
  findOneRaw(@Param() params: { id: string }) {
    const user = DB_USERS.find(u => u.id === params.id);
    if (!user) throw new NotFoundException('Not found');
    return user;
  }

  /** GET /api/users/:id/safe — one user, serialized */
  @Get('/:id/safe')
  @Serialize(UserResponseDto, { whitelist: true })
  findOneSafe(@Param() params: { id: string }) {
    const user = DB_USERS.find(u => u.id === params.id);
    if (!user) throw new NotFoundException('Not found');
    return user;
  }
}
