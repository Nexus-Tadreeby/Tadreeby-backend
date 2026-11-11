import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, InternshipStatus, NotificationType, UserRole } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { SharedNotificationService } from 'src/common/services/notification.service';

@Injectable()
export class ApplicationsService {
    constructor(
        private readonly prisma: DatabaseService,
        private readonly notifications: SharedNotificationService,
    ) { }

    async listCompanyApplications(companyId?: number, opportunityId?: number, status?: ApplicationStatus) {
        return this.prisma.application.findMany({
            where: {
                ...(companyId ? { opportunity: { companyId } } : {}),
                ...(opportunityId ? { opportunityId } : {}),
                ...(status ? { status } : {}),
            },
            include: {
                student: { include: { user: true } },
                opportunity: true,
            },
            orderBy: { appliedAt: 'desc' },
        });
    }

    async findOneForCompany(id: number, companyId: number) {
        const application = await this.prisma.application.findFirst({
            where: { id, opportunity: { companyId } },
            include: {
                student: { include: { user: true } },
                opportunity: true,
            },
        });

        if (!application) throw new NotFoundException('Application not found');
        return application;
    }

    async acceptApplication(id: number, companyId: number) {
        const application = await this.prisma.application.findFirst({
            where: { id, opportunity: { companyId } },
            include: { opportunity: true, student: true },
        });

        if (!application) throw new NotFoundException('Application not found');
        if (application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException('Application is not pending');
        }

        const internship = await this.prisma.internship.create({
            data: {
                opportunityId: application.opportunityId,
                companyId: application.opportunity.companyId,
                universityId: application.student.universityId,
                status: InternshipStatus.ACTIVE,
                students: {
                    create: {
                        studentId: application.studentId,
                    },
                },
            },
        });

        const updated = await this.prisma.application.update({
            where: { id },
            data: {
                status: ApplicationStatus.ACCEPTED,
                reviewedAt: new Date(),
            },
            include: { student: { include: { user: true } }, opportunity: true },
        });

        await this.notifications.createAndEmit(
            application.studentId,
            'Application accepted',
            `Your application for ${application.opportunity.title} was accepted.`,
            NotificationType.APPLICATION,
            { applicationId: application.id, internshipId: internship.id },
        );

        return { application: updated, internship };
    }

    async rejectApplication(id: number, rejectionReason: string, companyId: number) {
        const application = await this.prisma.application.findFirst({
            where: { id, opportunity: { companyId } },
            include: { opportunity: true, student: { include: { user: true } } },
        });

        if (!application) throw new NotFoundException('Application not found');

        const updated = await this.prisma.application.update({
            where: { id },
            data: {
                status: ApplicationStatus.REJECTED,
                rejectionReason,
                reviewedAt: new Date(),
            },
        });

        await this.notifications.createAndEmit(
            application.studentId,
            'Application rejected',
            `Your application for ${application.opportunity.title} was rejected. ${rejectionReason}`,
            NotificationType.APPLICATION,
            { applicationId: application.id },
        );

        return updated;
    }
}
