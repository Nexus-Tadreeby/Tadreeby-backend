import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { IsPublic } from '../decorators/isPublic.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        // ✅ Check if route is public
        const isPublic = this.reflector.get(IsPublic, context.getHandler());
        if (isPublic) return true;

        // ✅ Get required roles
        const requiredRoles = this.reflector.get(Roles, context.getHandler());

        // ✅ If no roles required, allow access (but still authenticated)
        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user;

        if (!user) throw new UnauthorizedException('Unauthorized');

        // ✅ Check if user has required role
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Forbidden: insufficient role');
        }

        return true;
    }
}