import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.role';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserPayload } from '../interfaces/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: UserPayload }>();

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return roles.some((role) => user.role?.includes(role));
  }
}
