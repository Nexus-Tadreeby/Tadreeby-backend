import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException, ForbiddenException, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { DatabaseService } from '../../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthedUser } from '../../common/decorators/authedUser.decorator';
import type { authedUserType } from '../../common/types/unifiedType.types';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Admin/Students')
@ApiBearerAuth()
@Controller('admin/students')
export class StudentAdminController {
    constructor(
        private studentService: StudentService,
        private prisma: DatabaseService,
        private eventEmitter: EventEmitter2,
    ) { }

    @Get('pending')
    @ApiOperation({ summary: 'List pending student applications for admin university' })
    @ApiResponse({ status: 200, description: 'Array of pending students or message' })
    async pending(@AuthedUser() user: authedUserType) {
        if (user.role !== UserRole.UNIVERSITY_ADMIN) {
            throw new ForbiddenException('Only university admins can view pending applications');
        }

        const admin = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!admin || !admin.universityId) {
            throw new ForbiddenException('University admin profile incomplete');
        }

        const users = await this.prisma.user.findMany({
            where: {
                universityId: admin.universityId,
                studentProfile: { approvalStatus: 'PENDING' },
            },
            include: { studentProfile: true, university: true, company: true },
        });

        if (!users || users.length === 0) {
            return { message: 'There is no pending students right now' };
        }

        // map to a concise response including student name and university/company info
        const mapped = users.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            university: u.university ? { id: u.university.id, name: u.university.name } : null,
            company: u.company ? { id: u.company.id, name: u.company.name } : null,
            studentProfile: u.studentProfile,
        }));

        return mapped;
    }

    @Post(':id/approve')
    @ApiOperation({ summary: 'Approve a student application' })
    @ApiResponse({ status: 200, description: 'Approved student with enriched user and university/company info' })
    async approve(@AuthedUser() user: authedUserType, @Param('id') id: string) {
        if (user.role !== UserRole.UNIVERSITY_ADMIN) {
            throw new ForbiddenException('Only university admins can approve applications');
        }

        const admin = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!admin || !admin.universityId) {
            throw new ForbiddenException('University admin profile incomplete');
        }

        const userId = Number(id);
        const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Student profile not found');
        if (profile.universityId !== admin.universityId) {
            throw new ForbiddenException('Cannot approve students from another university');
        }

        const updated = await this.prisma.studentProfile.update({
            where: { userId },
            data: { approvalStatus: 'APPROVED', approvedAt: new Date(), rejectionReason: null },
        });

        this.eventEmitter.emit('student.approved', { userId, adminId: user.id });

        // return enriched user info
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { studentProfile: true, university: true, company: true },
        });

        if (!u) throw new NotFoundException('User not found');

        const mapped = {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            university: u.university ? { id: u.university.id, name: u.university.name } : null,
            company: u.company ? { id: u.company.id, name: u.company.name } : null,
            studentProfile: u.studentProfile,
        };

        return { user: mapped };
    }

    @Post(':id/reject')
    @ApiOperation({ summary: 'Reject a student application with reason' })
    @ApiResponse({ status: 200, description: 'Rejected student with enriched user and university/company info' })
    async reject(@AuthedUser() user: authedUserType, @Param('id') id: string, @Body() body: any) {
        if (user.role !== UserRole.UNIVERSITY_ADMIN) {
            throw new ForbiddenException('Only university admins can reject applications');
        }

        const admin = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!admin || !admin.universityId) {
            throw new ForbiddenException('University admin profile incomplete');
        }

        const userId = Number(id);
        const reason = (body && body.reason) || null;
        if (!reason) throw new BadRequestException('reason is required');

        const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Student profile not found');
        if (profile.universityId !== admin.universityId) {
            throw new ForbiddenException('Cannot reject students from another university');
        }

        const updated = await this.prisma.studentProfile.update({
            where: { userId },
            data: { approvalStatus: 'REJECTED', rejectionReason: reason, approvedAt: null },
        });

        this.eventEmitter.emit('student.rejected', { userId, reason, adminId: user.id });

        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { studentProfile: true, university: true, company: true },
        });

        if (!u) throw new NotFoundException('User not found');

        const mapped = {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            university: u.university ? { id: u.university.id, name: u.university.name } : null,
            company: u.company ? { id: u.company.id, name: u.company.name } : null,
            studentProfile: u.studentProfile,
        };

        return { user: mapped };
    }
}
