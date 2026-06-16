import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';


@Injectable()
export class StudentRestrictedGuard implements CanActivate {
    constructor(private prisma: DatabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;

      
        if (!user || user.role !== 'STUDENT') return true;

        const profile = await this.prisma.studentProfile.findUnique({
            where: { userId: user.sub ?? user.id },
        });

        if (!profile) {
            throw new ForbiddenException('Profile not found');
        }

        const status = profile.approvalStatus;

 
        if (status === 'PENDING' || status === 'REJECTED') {
            const isProfileOnly = Reflect.getMetadata(
                'profileOnly',
                context.getHandler(),
            );

            if (isProfileOnly) return true;

            throw new ForbiddenException('Account not approved');
        }

        return true;
    }
}



// import {
//     CanActivate,
//     ExecutionContext,
//     ForbiddenException,
//     Injectable,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { StudentApprovalStatus } from '@prisma/client';
// import { ALLOWED_STATUSES_KEY } from './allowed-statuses.decorator';

// @Injectable()
// export class StudentRestrictedGuard implements CanActivate {
//     constructor(private readonly reflector: Reflector) { }

//     canActivate(context: ExecutionContext): boolean {
//         const req = context.switchToHttp().getRequest();
//         const user = req.user;

//         if (!user) return true;

//         if (user.role !== 'STUDENT') return true;

//         const allowedStatuses =
//             this.reflector.get<StudentApprovalStatus[]>(
//                 ALLOWED_STATUSES_KEY,
//                 context.getHandler(),
//             );


//         if (!allowedStatuses) return true;

//         const status = user.studentProfile?.approvalStatus;

//         if (!status) {
//             throw new ForbiddenException('Profile not found');
//         }

//         if (!allowedStatuses.includes(status)) {
//             throw new ForbiddenException(
//                 `Access denied for status: ${status}`,
//             );
//         }

//         return true;
//     }
// }