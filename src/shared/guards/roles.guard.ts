import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class AppRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<UserRole | UserRole[]>(Roles, context.getHandler());
        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user as any;

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!roles.includes(user.role)) {
            throw new ForbiddenException('Forbidden: insufficient role');
        }

        return true;
    }
}
